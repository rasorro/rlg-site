export default function AboutPage() {
    return (
        <main className="relative z-[10] min-h-[calc(100dvh-var(--rlg-nav-h))] bg-brand-background px-6 py-16 text-brand-text">
            <div className="mx-auto max-w-5xl border-3 border-black bg-brand-pipe p-6 sm:p-10">
                <h1 className="engraved-title text-[3rem] font-bold">About RLG</h1>
                <p className="engraved-text mt-4 text-[2rem] leading-relaxed">
                    Established in 2025, we are a two person game studio dedicated to learning every level of the game development process. So far, we have used Unity as our primary game engine, with tools such as Blender, Photopea, Aesprite, Inkspace, and Gimp to help make our assets. 
                </p>
            </div>
        </main>
    );
}
