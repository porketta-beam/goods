import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div
      className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">


      <Card className="@container/card">
        <CardHeader>
          <CardDescription>연간 기대수익률</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            8.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +5.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            최근 상승 추세에 있음 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            최근 3년 평균 기준
          </div>
        </CardFooter>
      </Card>



      <Card className="@container/card">
        <CardHeader>
          <CardDescription>연간 변동성</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            24.3%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            이번 분기 12% 상승 <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            일일 수익률 기준
          </div>
        </CardFooter>
      </Card>



      <Card className="@container/card">
        <CardHeader>
          <CardDescription>사고 발생률</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            2.8회
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -8%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
             최근 3년 연속 하락중<IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">연간 평균 (포아송 λ)</div>
        </CardFooter>
      </Card>



      <Card className="@container/card">
        <CardHeader>
          <CardDescription>추천 보험료</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            450원
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            최근 2년 연속 하락 <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">익스포저 1주 기준</div>
        </CardFooter>
      </Card>
    </div>
  );
}
