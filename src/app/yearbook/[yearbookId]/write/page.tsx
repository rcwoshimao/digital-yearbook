import { redirect } from "next/navigation";

type WriteEntryPageProps = {
  params: {
    yearbookId: string;
  };
};

export default function LegacyWriteEntryPage({ params }: WriteEntryPageProps) {
  redirect(`/write/${params.yearbookId}`);
}
