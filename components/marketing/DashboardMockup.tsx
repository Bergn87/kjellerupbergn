import { LayoutDashboard, Bell, ArrowRight, FileText, Users, TrendingUp } from 'lucide-react'

export default function DashboardMockup() {
  return (
    <div className="relative">
      {/* Main dashboard card */}
      <div className="rounded-2xl bg-white shadow-2xl border border-gray-200/50 overflow-hidden transform rotate-1 md:rotate-2">
        {/* Top bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white">
          <LayoutDashboard className="h-3.5 w-3.5 text-bergn-accent" />
          <span className="text-xs font-semibold">Hansen Tagrens</span>
          <span className="text-[9px] text-white/40 ml-auto">bergn.dk</span>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3 p-4">
          <div className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Nye leads</span>
            </div>
            <p className="text-xl font-bold text-gray-900">12</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="h-3 w-3 text-gray-400" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Tilbud sendt</span>
            </div>
            <p className="text-xl font-bold text-gray-900">8</p>
          </div>
          <div className="rounded-lg border border-gray-100 p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-[10px] text-gray-400 uppercase tracking-wide">Omsætning</span>
            </div>
            <p className="text-xl font-bold text-gray-900">47.200</p>
          </div>
        </div>

        {/* Recent list */}
        <div className="px-4 pb-4">
          <div className="rounded-lg border border-gray-100">
            <div className="px-3 py-2 border-b border-gray-50">
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Seneste forespørgsler</span>
            </div>
            {[
              { name: 'Anders Jensen', addr: 'Roskilde', amount: '28.400', status: 'Afventer' },
              { name: 'Mette Nielsen', addr: 'Slagelse', amount: '35.650', status: 'Accepteret' },
              { name: 'Lars Petersen', addr: 'Holbæk', amount: '22.100', status: 'Afventer' },
            ].map((row) => (
              <div key={row.name} className="flex items-center justify-between px-3 py-2 border-b border-gray-50 last:border-0">
                <div>
                  <p className="text-xs font-medium text-gray-900">{row.name}</p>
                  <p className="text-[10px] text-gray-400">{row.addr}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium">{row.amount} kr.</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border ${row.status === 'Accepteret' ? 'border-green-300 text-green-700' : 'border-bergn-accent text-bergn-accent-text'}`}>
                    {row.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating notification card */}
      <div className="absolute -top-4 -left-4 md:-left-8 rounded-xl bg-white shadow-xl border border-gray-200 p-3.5 max-w-[220px] transform -rotate-2">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5 text-bergn-cta" />
            <span className="text-xs font-semibold text-gray-900">Nyt lead!</span>
          </div>
          <span className="text-[9px] text-green-600 font-medium">lige nu</span>
        </div>
        <p className="text-[11px] text-gray-600 mb-2">Søren Hansen, Næstved — Tagrens, 148 m²</p>
        <button className="flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline">
          Se tilbud <ArrowRight className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  )
}
