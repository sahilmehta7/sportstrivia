import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ChallengesClient } from "./ChallengesClient";
import { getChallengesForUserDashboard } from "@/lib/services/challenge.service";

type DashboardChallenge = Awaited<
  ReturnType<typeof getChallengesForUserDashboard>
>["activeChallenges"][number];

function serializeChallenge(challenge: DashboardChallenge) {
  return {
    id: challenge.id,
    quizId: challenge.quizId,
    quiz: {
      title: challenge.quiz.title,
      slug: challenge.quiz.slug,
      difficulty: challenge.quiz.difficulty,
    },
    challenger: {
      id: challenge.challenger.id,
      name: challenge.challenger.name,
      image: challenge.challenger.image,
    },
    challenged: {
      id: challenge.challenged.id,
      name: challenge.challenged.name,
      image: challenge.challenged.image,
    },
    challengerScore:
      challenge.challengerScore === null ? null : Number(challenge.challengerScore),
    challengedScore:
      challenge.challengedScore === null ? null : Number(challenge.challengedScore),
    status: challenge.status,
    createdAt: challenge.createdAt.toISOString(),
    expiresAt: challenge.expiresAt ? challenge.expiresAt.toISOString() : null,
  };
}

export default async function ChallengesPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const userId = session.user.id;

  const { activeChallenges, receivedChallenges, sentChallenges } =
    await getChallengesForUserDashboard(userId);

  return (
    <ChallengesClient
      currentUserId={userId}
      activeChallenges={activeChallenges.map(serializeChallenge)}
      receivedChallenges={receivedChallenges.map(serializeChallenge)}
      sentChallenges={sentChallenges.map(serializeChallenge)}
    />
  );
}
