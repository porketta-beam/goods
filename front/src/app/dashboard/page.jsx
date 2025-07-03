import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "@/data/datatable.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)"
        }
      }>
        <AppSidebar variant="inset" />
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
                <div className="@container/main flex-1 gap-2 min-h-0">
                    <div id="main-content" className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 flex-1 h-full">
                        <SectionCards />
                        <div id="row-2" className="flex-1 flex flex-row px-4 lg:px-6 h-full">
                            <div className="flex-[4] h-full">
                                <ChartAreaInteractive />
                            </div>
                            <div className="flex-[2] h-full">
                                <div> 안녕하세요</div>
                            </div>
                        </div>
                        {/* <DataTable data={data} /> */}
                    </div>
                </div>
            </div>
        </SidebarInset>
    </SidebarProvider>
  );
}