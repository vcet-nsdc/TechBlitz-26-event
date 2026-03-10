import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Submission } from "@/types/entities";

export function SubmissionPreview({ submission }: { submission?: Submission | null }) {
  if (!submission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No submission yet</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (submission.type === "FIGMA_LINK") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Figma Submission</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe src={submission.url} className="h-72 w-full rounded-md border border-zinc-800" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>GitHub Repository</CardTitle>
      </CardHeader>
      <CardContent>
        <a href={submission.url} target="_blank" className="text-sm text-indigo-300 underline" rel="noreferrer">
          {submission.url}
        </a>
      </CardContent>
    </Card>
  );
}
