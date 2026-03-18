import { getLastReview } from '@/lib/actions/reviews'
import { ReviewsClient } from '@/components/reviews/reviews-client'

export default async function ReviewsPage() {
  const [weeklyResult, monthlyResult, annualResult] = await Promise.all([
    getLastReview('weekly'),
    getLastReview('monthly'),
    getLastReview('annual'),
  ])

  return (
    <ReviewsClient
      lastWeekly={weeklyResult.data}
      lastMonthly={monthlyResult.data}
      lastAnnual={annualResult.data}
    />
  )
}
