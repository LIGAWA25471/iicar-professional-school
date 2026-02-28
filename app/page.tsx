import Image from "next/image"

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0e1b35] font-sans">
      <main className="flex flex-col items-center gap-6 px-6 py-16 text-center">
        <Image
          src="/logo.jpg"
          alt="IICAR Global College crest"
          width={200}
          height={200}
          className="rounded-xl"
          priority
        />
        <h1 className="text-2xl font-bold tracking-wide text-white sm:text-3xl">
          Institute of International Career Advancement and Recognition
        </h1>
        <p className="max-w-sm text-base text-blue-200">
          AI-Powered Self-Paced Professional Certification Platform
        </p>
      </main>
    </div>
  )
}
