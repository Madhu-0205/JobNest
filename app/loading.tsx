export default function Loading() {
    return (
        <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center space-y-4 z-50">
            <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary rounded-full animate-pulse transition-all duration-1000"></div>
                </div>
            </div>
            <h2 className="text-slate-800 font-black text-xl animate-pulse tracking-widest uppercase">JobNest</h2>
        </div>
    );
}
