/**
 * Ruta dinámica de SEÑAL 88, conservada como archivo independiente.
 * El explorador principal Backrooms vive en la ruta /.
 */
import { notFound } from "next/navigation";
import Experience from "@/components/Experience";
import { chapters } from "@/data/chapters";

// Enumera los capítulos para generar sus páginas durante la compilación.
export function generateStaticParams() {
  return chapters.map((chapter) => ({ chapter: chapter.id }));
}

// En esta versión de Next.js params es asíncrono: se resuelve antes de consultar el identificador.
export async function generateMetadata({ params }) {
  const { chapter: chapterId } = await params;
  const chapter = chapters.find((item) => item.id === chapterId);

  if (!chapter) return {};

  return {
    title: `${chapter.label} — SEÑAL 88`,
    description: chapter.copy,
  };
}

// Valida la ruta en el servidor y responde con 404 cuando no existe el capítulo.
export default async function ChapterPage({ params }) {
  const { chapter: chapterId } = await params;
  const chapterExists = chapters.some((item) => item.id === chapterId);

  if (!chapterExists) notFound();

  return <Experience initialChapterId={chapterId} />;
}
