import Breadcrumb from "@/components/ui/breadcrumb";
import ParseQuestionClient from "../_components/parse_question_client";

export const metadata = {
  title: "Parse Bank Soal | Admin",
};

export default function ParseQuestionPage() {
  return (
    <>
      <Breadcrumb pageName="Parse Bank Soal Cepat" showNav={false} />
      <div className="mt-4">
        <ParseQuestionClient />
      </div>
    </>
  );
}