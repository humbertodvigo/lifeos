import { Header } from '@/components/shared/header'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getLifeVision, getOKRs } from '@/lib/actions/planning'
import { MissionCard } from '@/components/planning/mission-card'
import { OKRList } from '@/components/planning/okr-list'

export default async function PlanningPage() {
  const currentYear = new Date().getFullYear()

  const [visionResult, okrsResult] = await Promise.all([
    getLifeVision(),
    getOKRs(currentYear),
  ])

  const vision = visionResult.data as {mission:string|null;values:string[]} | null
  const okrs = (okrsResult.data ?? []) as Array<{id:string;title:string;period:string;year:number;quarter:number|null;status:string;shared:boolean;key_results:Array<{id:string;okr_id:string;title:string;target:number;current:number;unit:string;due_date:string|null}>}>

  return (
    <div className="flex flex-col h-screen">
      <Header
        title="OKRs & Visão"
        description="Planejamento estratégico e objetivos"
      />
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          <MissionCard
            mission={vision?.mission ?? null}
            values={vision?.values ?? []}
          />

          <OKRList initialOKRs={okrs} />
        </div>
      </ScrollArea>
    </div>
  )
}
