"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { BarChart, Bar, ResponsiveContainer } from "recharts"
import { LineChart as RechartsLineChart, Line, ResponsiveContainer as RechartsResponsiveContainer } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

// 차트 데이터에 더미데이터로 넣어놨음
import chartData from "@/data/monte_result.json"
import lastPriceList from "@/data/last_price_list.json"


// 차트 설정 객체
// - visitors: 전체 방문자 수를 표시하는 라인의 설정
// - desktop: 데스크톱 방문자 수를 표시하는 라인의 설정 (primary 색상 사용)
// - mobile: 모바일 방문자 수를 표시하는 라인의 설정 (primary 색상 사용)
// ChartAreaInteractive 컴포넌트에서 차트를 그릴 때 사용됨
const chartConfig = {
  visitors: {
    label: "Visitors",
  },

  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },

  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  }
}

// last_price_list의 분포를 히스토그램 데이터로 변환
function getHistogramData(data, binCount = 20) {
  if (!data || data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binSize = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    bin: min + i * binSize,
    count: 0,
    binCenter: min + (i + 0.5) * binSize,
  }));
  data.forEach((value) => {
    let idx = Math.floor((value - min) / binSize);
    if (idx === binCount) idx = binCount - 1; // max값 포함
    bins[idx].count += 1;
  });
  return bins.map((b, i) => ({
    bin: `${b.bin.toFixed(0)}~${(b.bin + binSize).toFixed(0)}`,
    count: b.count,
    binCenter: b.binCenter,
  }));
}
const histogramData = getHistogramData(lastPriceList, 30);

// lastPriceList의 평균, 표준편차로 정규분포 곡선 데이터 생성
function getNormalCurveData(data, bins) {
  if (!data || data.length === 0) return [];
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
  // 히스토그램의 binCenter 기준으로 정규분포 확률밀도 계산
  const total = data.length;
  return bins.map((b) => {
    const x = b.binCenter;
    const y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
    // y값을 히스토그램 스케일에 맞게 조정 (최대값 기준)
    return {
      bin: b.bin,
      norm: y * total * (bins[1].binCenter - bins[0].binCenter),
    };
  });
}
const normalCurveData = getNormalCurveData(lastPriceList, histogramData);

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // 날짜 필터링 (date가 0~60인 경우만)
  const filteredData = chartData.filter((item) => {
    const dateNum = typeof item.date === 'number' ? item.date : parseInt(item.date, 10);
    return dateNum >= 0 && dateNum <= 60;
  })

  // 시뮬레이션 key 자동 추출 (sim1, sim2, ...)
  const simKeys = chartData.length > 0 ? Object.keys(chartData[0]).filter(key => key.startsWith("sim")) : [];

  // 구별 가능한 색상 팔레트 (최대 10개, 그 이상은 반복)
  const colorPalette = [
    "#1f77b4", // 파랑
    "#ff7f0e", // 주황
    "#2ca02c", // 초록
    "#d62728", // 빨강
    "#9467bd", // 보라
    "#8c564b", // 갈색
    "#e377c2", // 핑크
    "#7f7f7f", // 회색
    "#bcbd22", // 연두
    "#17becf"  // 청록
  ];

  // y축 min/max 계산 (filteredData의 모든 sim 값 중 최소/최대)
  const yMin = filteredData.length > 0 ? Math.min(...filteredData.flatMap(item => simKeys.map(k => item[k])).filter(v => typeof v === 'number')) : 0;
  const yMax = filteredData.length > 0 ? Math.max(...filteredData.flatMap(item => simKeys.map(k => item[k])).filter(v => typeof v === 'number')) : 1;

  // --- 디버깅용 로그 ---
  console.log("[chart-area-interactive] chartData:", chartData)
  console.log("[chart-area-interactive] simKeys:", simKeys)
  console.log("[chart-area-interactive] filteredData:", filteredData)
  // -------------------

  return (
    <Card className="@container/card h-full">
      {/* 카드 헤더 */}
      <CardHeader>
        <CardTitle>몬테카를로 시뮬레이션 결과</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            30회 시뮬레이션, 60일 예측 결과
          </span>
          <span className="@[540px]/card:hidden">30회 시뮬레이션, 60일 예측 결과</span>
        </CardDescription>

        {/* <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex">
            <ToggleGroupItem value="90d">최근 3개월 기준</ToggleGroupItem>
            <ToggleGroupItem value="30d">최근 30일 기준</ToggleGroupItem>
            <ToggleGroupItem value="7d">최근 7일 기준</ToggleGroupItem>
          </ToggleGroup>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value">
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction> */}
      </CardHeader>

      {/* 차트 영역 3:2 분할 */}
      <CardContent className="px-0 pt-0 sm:px-0 sm:pt-2 h-full">
        <div style={{ display: 'flex', width: '100%', height: '100%' }}>
          {/* 왼쪽: LineChart (3/5) */}
          <div style={{ flex: 3, minWidth: 0, margin: 0, padding: 0, display: 'flex', alignItems: 'center' }}>
            <ChartContainer config={chartConfig} className="h-full w-full">
              <AreaChart data={filteredData} height={250} width={undefined}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  tick={false}
                />
                <YAxis domain={[yMin, yMax]} tickLine={false} axisLine={false} width={60} tick={false} />
                {simKeys.map((key, idx) => (
                  <Area
                    key={key}
                    dataKey={key}
                    type="natural"
                    fill="none"
                    stroke={colorPalette[idx % colorPalette.length]}
                    strokeWidth={1}
                    opacity={0.7}
                    dot={false}
                    stackId={undefined}
                    activeDot={false}
                  />
                ))}
              </AreaChart>
            </ChartContainer>
          </div>
          {/* 오른쪽: last_price_list 분포 BarChart (2/5) */}
          <div style={{ flex: 2, minWidth: 0, margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" >
              <BarChart data={histogramData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="bin" type="category" width={60} tick={false} axisLine={false} tickLine={false} reversed />
                <Bar dataKey="count" fill="#8884d8" />
                {/* 정규분포 곡선 라인 */}
                <Line type="monotone" dataKey="norm" data={normalCurveData} stroke="#d62728" dot={false} strokeWidth={2} activeDot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
