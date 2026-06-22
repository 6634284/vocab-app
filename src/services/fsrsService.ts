import { Card as FSRSCard, createEmptyCard, fsrs, generatorParameters, FSRSParameters, Rating, State, Grade } from 'ts-fsrs';
import { Card, Rating as AppRating, ButtonPreview } from '../types';

const params: Partial<FSRSParameters> = generatorParameters({
  request_retention: 0.9,
  maximum_interval: 365,
});

const scheduler = fsrs(params);

export function createNewCard(): FSRSCard {
  return createEmptyCard();
}

export function appRatingToFSRS(rating: AppRating): Grade {
  switch (rating) {
    case 'Again': return Rating.Again as Grade;
    case 'Hard': return Rating.Hard as Grade;
    case 'Good': return Rating.Good as Grade;
  }
}

export function dbCardToFSRSCard(card: Card): FSRSCard {
  return {
    due: new Date(card.due),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    learning_steps: 0,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as State,
    last_review: card.lastReview ? new Date(card.lastReview) : undefined,
  };
}

export function fsrsCardToDbCard(wordId: number, card: FSRSCard): Omit<Card, 'id'> {
  return {
    wordId,
    due: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as number,
    lastReview: card.last_review?.getTime() || 0,
  };
}

export function scheduleNext(card: Card, rating: AppRating): Card {
  const fsrsCard = dbCardToFSRSCard(card);
  const result = scheduler.next(fsrsCard, new Date(), appRatingToFSRS(rating));
  return {
    ...card,
    ...fsrsCardToDbCard(card.wordId, result.card),
  };
}

export function getButtonPreviews(card: Card): ButtonPreview[] {
  const fsrsCard = dbCardToFSRSCard(card);
  const now = new Date();

  const ratings: { rating: AppRating; fsrs: Grade; label: string; color: string; bgColor: string }[] = [
    { rating: 'Again', fsrs: Rating.Again as Grade, label: '不认识', color: '#DC3545', bgColor: 'rgba(220,53,69,0.1)' },
    { rating: 'Hard', fsrs: Rating.Hard as Grade, label: '不确定', color: '#FFC107', bgColor: 'rgba(255,193,7,0.1)' },
    { rating: 'Good', fsrs: Rating.Good as Grade, label: '认识', color: '#28A745', bgColor: 'rgba(40,167,69,0.1)' },
  ];

  return ratings.map(({ rating, fsrs, label, color, bgColor }) => {
    const result = scheduler.next(fsrsCard, now, fsrs);
    const scheduledDays = result.card.scheduled_days;
    const interval = Math.max(0, Math.ceil(scheduledDays));
    return { rating, label, color, bgColor, interval };
  });
}
