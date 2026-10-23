import { useEffect, useMemo, useState } from 'react';

const money = new Intl.NumberFormat('vi-VN');
const datetime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const today = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date());

function Icon({ name, className = 'size-4' }) {
  const common = { className, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', viewBox: '0 0 24 24', 'aria-hidden': true };
  const shapes = {
    search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    arrow: <path d="M5 12h14m-7-7 7 7-7 7"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 1 1 8 0v3"/></>,
    close: <path d="m18 6-12 12M6 6l12 12"/>,
    laptop: <><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20l-2-4H4z"/></>,
    filter: <><path d="M4 5h16M7 12h10m-7 7h4"/></>
  };
  return <svg {...common}>{shapes[name]}</svg>;
}

function StatCard({ label, value, note }) {
  return <div className="rounded-2xl border border-white/[.07] bg-white/[.035] p-4 sm:p-5">
    <div className="text-xs font-medium text-slate-400">{label}</div>
    <div className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</div>
    {note && <div className="mt-1 text-xs text-slate-500">{note}</div>}
  </div>;
}

function Login({ onLogin }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể mở dashboard');
      setCode(''); onLogin();
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }
  return <div className="fixed inset-0 z-50 grid place-items-center bg-[#050c16]/90 p-4 backdrop-blur-xl">
    <form onSubmit={submit} className="w-full max-w-[420px] rounded-3xl border border-cyan-200/10 bg-[#0b1b2b] p-7 shadow-[0_30px_100px_#0009] sm:p-9">
      <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-600 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/15">SH</div>
      <div className="mt-6 text-xs font-bold uppercase tracking-[.22em] text-cyan-300">SoundHub · Internal</div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nhập mã truy cập</h1>
      <p className="mt-2 text-sm leading-6 text-slate-400">Mở bảng tra cứu voucher dành cho nhân sự được cấp mã.</p>
      <label className="mt-6 block text-xs font-medium text-slate-300" htmlFor="access-code">Mã truy cập</label>
      <input autoFocus id="access-code" value={code} onChange={(e) => setCode(e.target.value)} type="password" autoComplete="current-password" className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#06111d] px-4 text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/70 focus:ring-4 focus:ring-cyan-300/10" placeholder="Nhập mã của bạn" required />
      <div className="mt-2 min-h-5 text-sm text-rose-300">{error}</div>
      <button disabled={busy} className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300 to-sky-500 font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? 'Đang kiểm tra…' : <>Vào dashboard <Icon name="arrow" /></>}</button>
      <div className="mt-5 flex items-center gap-2 text-xs text-slate-500"><Icon name="lock" className="size-3.5"/> Dữ liệu chỉ được tải sau khi xác thực mã.</div>
    </form>
  </div>;
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [records, setRecords] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState('desc');
  const [phone, setPhone] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const pageValue = useMemo(() => records.reduce((sum, item) => sum + item.value, 0), [records]);

  async function loadRecords() {
    setLoading(true); setError('');
    const params = new URLSearchParams({ page, pageSize, sort });
    if (phone.trim()) params.set('phone', phone.trim());
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (campaignId) params.set('campaignId', campaignId);
    try {
      const response = await fetch(`/api/records?${params}`, { credentials: 'same-origin' });
      const data = await response.json();
      if (response.status === 401) { setAuthenticated(false); return; }
      if (!response.ok) throw new Error(data.error || 'Không tải được dữ liệu');
      setRecords(data.records); setTotal(data.total); setCampaigns(data.campaigns || []); setAuthenticated(true);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadRecords(); }, [page, pageSize, sort, phone, from, to, campaignId]);
  function resetFilters() { setPhone(''); setFrom(''); setTo(''); setCampaignId(''); setPage(1); }
  async function logout() { await fetch('/api/logout', { method: 'POST' }); setAuthenticated(false); }

  const stats = [
    { label: 'Voucher phù hợp', value: money.format(total), note: 'Theo bộ lọc hiện tại' },
    { label: 'Giá trị trên trang', value: `${money.format(pageValue)} đ`, note: `${records.length} voucher đang hiển thị` },
    { label: 'Chiến dịch', value: money.format(campaigns.length), note: 'Có trong dữ liệu' }
  ];

  return <div className="min-h-screen bg-[radial-gradient(ellipse_at_82%_-14%,#17436a_0%,transparent_42%),#07111f] text-slate-100">
    {/* {!authenticated && <Login onLogin={loadRecords} />}
     */}
    {!authenticated && <Login onLogin={() => { setAuthenticated(true); loadRecords(); }} />}
    <main className="mx-auto max-w-7xl px-4 pb-12 pt-6 sm:px-7 sm:pt-9">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-600 text-sm font-black text-slate-950 shadow-lg shadow-cyan-500/15">SH</div>
          <div><div className="text-sm font-bold tracking-[.12em]">SOUNDHUB</div><div className="mt-0.5 text-xs text-slate-500">Voucher dashboard</div></div>
        </div>
        {authenticated && <button onClick={logout} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white">Thoát</button>}
      </header>

      <section className="mb-6 mt-9 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><div className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">Campaign records</div><h1 className="mt-2 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Quản lý voucher</h1><p className="mt-2 text-sm text-slate-400">Tìm nhanh, lọc theo ngày và kiểm tra voucher đã phát hành.</p></div>
        <div className="w-fit rounded-full border border-white/[.08] bg-white/[.035] px-4 py-2 text-xs text-slate-300">{today}</div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">{stats.map((stat) => <StatCard key={stat.label} {...stat} />)}</section>

      <section className={`overflow-hidden rounded-2xl border border-white/[.08] bg-[#0a1928]/90 shadow-2xl shadow-black/10 ${loading ? 'opacity-70' : ''}`}>
        <div className="flex flex-col gap-3 border-b border-white/[.07] p-4 sm:p-5">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold"><Icon name="filter" className="size-4 text-cyan-300"/> Bộ lọc</div><button onClick={resetFilters} className="text-xs text-slate-400 transition hover:text-cyan-200">Xóa bộ lọc</button></div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(230px,1.4fr)_minmax(145px,.8fr)_minmax(145px,.8fr)_minmax(190px,1fr)_120px_150px]">
            <label className="relative"><Icon name="search" className="absolute left-3 top-3 size-4 text-slate-500"/><input value={phone} onChange={(e) => { setPage(1); setPhone(e.target.value); }} className="h-10 w-full rounded-xl border border-white/10 bg-[#071321] pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-300/50" placeholder="Tìm số điện thoại" /></label>
            <label className="relative"><Icon name="calendar" className="pointer-events-none absolute left-3 top-3 size-4 text-slate-500"/><input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value); }} className="h-10 w-full rounded-xl border border-white/10 bg-[#071321] pl-9 pr-2 text-sm text-slate-300 outline-none focus:border-cyan-300/50" aria-label="Từ ngày" /></label>
            <label className="relative"><Icon name="calendar" className="pointer-events-none absolute left-3 top-3 size-4 text-slate-500"/><input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value); }} className="h-10 w-full rounded-xl border border-white/10 bg-[#071321] pl-9 pr-2 text-sm text-slate-300 outline-none focus:border-cyan-300/50" aria-label="Đến ngày" /></label>
            <select value={campaignId} onChange={(e) => { setPage(1); setCampaignId(e.target.value); }} className="h-10 rounded-xl border border-white/10 bg-[#071321] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/50"><option value="">Tất cả chiến dịch</option>{campaigns.map((id) => <option key={id} value={id}>{id}</option>)}</select>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} className="h-10 rounded-xl border border-white/10 bg-[#071321] px-3 text-sm text-slate-300 outline-none focus:border-cyan-300/50"><option value={25}>25 dòng</option><option value={50}>50 dòng</option><option value={100}>100 dòng</option></select>
            <button onClick={() => setSort(sort === 'desc' ? 'asc' : 'desc')} className="h-10 rounded-xl border border-white/10 bg-[#071321] px-3 text-sm text-slate-300 transition hover:border-cyan-300/40">{sort === 'desc' ? 'Ngày mới nhất ↓' : 'Ngày cũ nhất ↑'}</button>
          </div>
        </div>

        {error && <div className="mx-4 mt-4 rounded-xl border border-rose-400/20 bg-rose-400/[.08] px-4 py-3 text-sm text-rose-200">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-white/[.07] bg-white/[.02] text-[11px] uppercase tracking-[.13em] text-slate-500"><th className="px-5 py-4 font-semibold">Ngày tạo</th><th className="px-5 py-4 font-semibold">Số điện thoại</th><th className="px-5 py-4 font-semibold">Voucher</th><th className="px-5 py-4 font-semibold">Giá trị</th><th className="px-5 py-4 font-semibold">Chiến dịch</th></tr></thead>
            <tbody>{records.map((row) => <tr key={row.id} className="border-b border-white/[.045] transition hover:bg-cyan-200/[.025]"><td className="whitespace-nowrap px-5 py-4 text-slate-400">{row.createdAt ? datetime.format(new Date(row.createdAt)) : '—'}</td><td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums tracking-wide text-slate-100">{row.phone}</td><td className="px-5 py-4"><span className="rounded-full border border-cyan-300/15 bg-cyan-300/[.08] px-2.5 py-1 text-xs font-bold text-cyan-200">{row.label || '—'}</span></td><td className="whitespace-nowrap px-5 py-4 font-medium tabular-nums text-slate-200">{money.format(row.value)} đ</td><td className="px-5 py-4 text-xs text-slate-400">{row.campaignId || '—'}</td></tr>)}</tbody>
          </table>
          {records.length === 0 && <div className="px-5 py-14 text-center text-sm text-slate-500">{loading ? 'Đang tải dữ liệu…' : 'Không tìm thấy voucher phù hợp.'}</div>}
        </div>
        <footer className="flex flex-col gap-3 border-t border-white/[.07] px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>{total ? `Hiển thị ${money.format((page - 1) * pageSize + 1)}–${money.format(Math.min(page * pageSize, total))} / ${money.format(total)} voucher` : 'Không có dữ liệu'}</div>
          <div className="flex items-center gap-2"><button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-35">← Trước</button><span className="min-w-20 text-center">Trang {page} / {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(page + 1)} className="flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:border-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-35">Sau <Icon name="chevron" className="size-3.5"/></button></div>
        </footer>
      </section>
      <div className="mt-4 text-center text-[11px] text-slate-600">SoundHub · Internal voucher records</div>
    </main>
  </div>;
}
