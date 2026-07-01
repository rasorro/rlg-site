type InfoSection = {
    title: string;
    text?: string;
    items?: string[];
};

type GameInfoPanelProps = {
    sections: InfoSection[];
    height: string;
    className?: string;
    showControlsDiagram?: boolean;
};

function SectionText({ text }: { text: string }) {
    return <p className="engraved-text mt-2 whitespace-normal text-[1.5rem] leading-snug text-brand-text">{text}</p>;
}

function SectionList({ items }: { items: string[] }) {
    return (
        <ul className="engraved-text mt-2 list-disc space-y-1 pl-5 text-[1.5rem] leading-snug text-brand-text marker:text-brand-background">
            {items.map((item) => (
                <li key={item}>{item}</li>
            ))}
        </ul>
    );
}

function ControlKey({ label, className = "" }: { label: string; className?: string }) {
    return (
        <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-md border border-black/80 bg-black/35 text-[1.25rem] font-black tracking-wide text-brand-glow ${className}`}
        >
            {label}
        </span>
    );
}

function ControlsDiagram() {
    return (
        <div className="mt-3 flex flex-wrap justify-center gap-3">
            <div className="w-fit rounded-md border border-black/75 bg-black/25 p-2">
                <p className="engraved-text mb-2 text-center text-[1.5rem] font-bold uppercase tracking-wider text-brand-glow">WASD</p>
                <div className="mx-auto grid w-fit grid-cols-3 justify-items-center gap-1.5">
                    <span />
                    <ControlKey label="W" />
                    <span />
                    <ControlKey label="A" />
                    <ControlKey label="S" />
                    <ControlKey label="D" />
                </div>
            </div>
            <div className="w-fit rounded-md border border-black/75 bg-black/25 p-2">
                <p className="engraved-text mb-2 text-center text-[1.5rem] font-bold uppercase tracking-wider text-brand-glow">Arrows</p>
                <div className="mx-auto grid w-fit grid-cols-3 justify-items-center gap-1.5">
                    <span />
                    <ControlKey label="↑" />
                    <span />
                    <ControlKey label="←" />
                    <ControlKey label="↓" />
                    <ControlKey label="→" />
                </div>
            </div>
        </div>
    );
}

export default function GameInfoPanel({ sections, height, className = "", showControlsDiagram = false }: GameInfoPanelProps) {
    return (
        <aside
            className={`mt-12 w-full max-w-[400px] border-4 border-black bg-brand-pipe xl:mt-0 xl:absolute xl:left-[calc(100%+1.5rem)] xl:top-1/2 xl:w-[400px] xl:max-w-none xl:-translate-y-1/2 ${className}`}
            style={{ height }}
        >
            <div className="h-full overflow-y-auto p-4">
                {sections.map((section, index) => (
                    <div key={section.title} className={index === 0 ? "rounded-md border border-black/70 bg-black/20 p-3" : "mt-3 rounded-md border border-black/70 bg-black/20 p-3"}>
                        <h2 className="engraved-title whitespace-nowrap text-[1.75rem] font-bold uppercase tracking-wide">{section.title}</h2>
                        {showControlsDiagram && section.title === "Controls" && <ControlsDiagram />}
                        {section.text && <SectionText text={section.text} />}
                        {section.items && <SectionList items={section.items} />}
                    </div>
                ))}
            </div>
        </aside>
    );
}

export type { InfoSection };