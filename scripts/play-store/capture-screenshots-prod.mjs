import { spawn } from 'node:child_process';
import net from 'node:net';

const DEFAULT_PORT = Number(process.env.PLAY_CAPTURE_PORT || 3310);

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      shell: false,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with code ${code}`));
      }
    });
  });
}

function canBindPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.on('error', () => resolve(false));
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
  });
}

async function resolveCapturePort(startPort, maxAttempts = 25) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const candidate = startPort + offset;
    if (await canBindPort(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Unable to find an open capture port starting at ${startPort}`);
}

async function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status === 404) {
        return;
      }
    } catch {
      // keep retrying
    }
    await wait(1000);
  }

  throw new Error(`Timed out waiting for server at ${url}`);
}

async function run() {
  const port = await resolveCapturePort(DEFAULT_PORT);
  const baseUrl = process.env.PLAY_BASE_URL || `http://localhost:${port}`;
  const captureEnv = {
    ...process.env,
    PLAY_BASE_URL: baseUrl,
    PORT: String(port),
    NODE_ENV: 'production',
    AUTH_TRUST_HOST: 'true',
    NEXTAUTH_URL: baseUrl,
    NEXT_PUBLIC_ACCOUNT_DELETION_ENABLED: 'true',
  };

  console.log(`Running production screenshot capture on ${baseUrl}`);
  await runCommand('npm', ['run', 'build'], captureEnv);

  const server = spawn('npx', ['next', 'start', '-p', String(port)], {
    stdio: 'inherit',
    env: captureEnv,
    shell: false,
  });

  try {
    await waitForServer(baseUrl, 90000);
    await runCommand('node', ['scripts/play-store/capture-screenshots.mjs'], captureEnv);
    await runCommand('node', ['scripts/play-store/apply-screenshot-overlays.mjs'], captureEnv);
    await runCommand('node', ['scripts/play-store/qa-screenshot-content.mjs'], captureEnv);
    await runCommand('node', ['scripts/play-store/validate-assets.mjs'], captureEnv);
  } finally {
    if (!server.killed) {
      server.kill('SIGTERM');
      await wait(800);
      if (!server.killed) {
        server.kill('SIGKILL');
      }
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
