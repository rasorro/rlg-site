import Link from "next/link";
import Image from "next/image";

type GameCard = {
  title: string;
  href: string;
  description: string;
  imageSrc?: string;
};

const GAMES: GameCard[] = [
  {
    title: "Rapid Path",
    href: "/rapid-path",
    description: "Play now",
    imageSrc: "/rapidPath.png",
  },
  {
    title: "Stickman Skydive Simulator",
    href: "/stickman-skydive-simulator",
    description: "Coming soon",
    imageSrc: "/stickmanSkydivePreview.png",
  },
  {
    title: "Swerve",
    href: "/swerve",
    description: "Coming soon",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-zinc-900 px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col items-center">
          <h1 className="mb-2 text-center text-3xl font-bold tracking-wide text-zinc-100 sm:text-4xl md:text-6xl">
            Reaction Lab Games
          </h1>
          <div className="flex h-[170px] w-[170px] items-center justify-center rounded-full border border-white/0 bg-zinc-0 sm:h-[210px] sm:w-[210px] md:h-[250px] md:w-[250px]">
            <Image
              src="/ReactionLabLogo.png"
              alt="Reaction Lab Logo"
              width={220}
              height={220}
              priority
              className="h-auto w-[78%]"
            />
          </div>
        </div>

        <section>
          <div className="grid gap-8 lg:grid-cols-3">
            {GAMES.map((game) => (
              <Link
                key={game.title}
                href={game.href}
                className="group block rounded-lg border border-white/10 bg-zinc-800/60 p-4 transition-colors hover:border-white/20"
              >
                <div className="aspect-square w-full overflow-hidden rounded-lg border border-white/20 bg-zinc-900">
                  {game.imageSrc ? (
                    <Image
                      src={game.imageSrc}
                      alt={game.title}
                      width={700}
                      height={700}
                      priority={game.title === "Rapid Path"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full rounded-lg border-2 border-dashed border-white/25" />
                  )}
                </div>

                <h2 className="mt-4 text-2xl font-bold transition-colors group-hover:text-zinc-300">
                  {game.title}
                </h2>
                <p className="mt-1 text-zinc-400 transition-colors group-hover:text-zinc-300">
                  {game.description} →
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
