const fs = require('fs');

const filePaths = [
  'components/notifications/DigestPreferencesCard.tsx',
  'components/notifications/PushSubscriptionCard.tsx',
  'components/shared/InstagramStoryTeaserMenu.tsx',
  'components/showcase/ShowcaseDailyCarousel.tsx',
  'lib/errors.ts'
];

for (const fp of filePaths) {
  if (!fs.existsSync(fp)) continue;
  let lines = fs.readFileSync(fp, 'utf8').split('\n');
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (fp.includes('DigestPreferencesCard.tsx') || fp.includes('PushSubscriptionCard.tsx') || fp.includes('errors.ts')) {
        if (line.includes('catch (_e)')) {
            lines[i] = line.replace('catch (_e)', 'catch');
            modified = true;
        }
        if (line.includes('catch (_e2)')) {
            lines[i] = line.replace('catch (_e2)', 'catch');
            modified = true;
        }
    }
    
    if (fp.includes('InstagramStoryTeaserMenu.tsx')) {
        if (line.includes('catch (__e)')) {
            lines[i] = line.replace('catch (__e)', 'catch');
            modified = true;
        }
    }

    if (fp.includes('ShowcaseDailyCarousel.tsx')) {
       if (line.includes('type, ')) {
           const l = line.replace('type, ', '');
           if (l !== line) {
              lines[i] = l;
              modified = true;
           }
       }
    }
  }

  if (modified) {
    fs.writeFileSync(fp, lines.join('\n'));
    console.log(`Fixed ${fp}`);
  }
}
