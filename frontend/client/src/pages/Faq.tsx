/* KisanSetu FAQ: compact public answers for farmers, buyers, and first-time visitors. */
import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";

const faqs = [
  [
    "Who is KisanSetu for?",
    "KisanSetu is designed for farmers, buyers, and the people coordinating the movement between them.",
  ],
  [
    "What can I do on the marketplace?",
    "You can browse produce that is ready to move, review its quantity and location, and use matching flows to identify a clearer next step.",
  ],
  [
    "How does Market Match work?",
    "The demo flow uses crop, quantity, location, and timing to show what a connected buyer and route experience could look like.",
  ],
  [
    "Is the pricing live?",
    "Some values shown in the public experience are illustrative demo scenarios. Live pricing and buyer data will depend on the connected marketplace implementation.",
  ],
  [
    "Can I use KisanSetu from a phone?",
    "Yes. The public experience is responsive, and the application can be extended for low-bandwidth farmer workflows.",
  ],
  [
    "How can I contact the team?",
    "Use the contact page to send a note about partnerships, pilot participation, or implementation questions.",
  ],
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <PublicLayout eyebrow="FAQ / KisanSetu">
      <section className="page-hero">
        <div className="container">
          <span className="eyebrow">FAQ</span>
          <h1>A few clear answers.</h1>
          <p>
            Short answers for the people moving produce, finding buyers, and
            building a clearer market.
          </p>
        </div>
      </section>

      <section className="faq-list">
        {faqs.map(([question, answer], index) => (
          <div
            className={`faq-item ${open === index ? "open" : ""}`}
            key={question}
          >
            <button
              onClick={() => setOpen(open === index ? null : index)}
              aria-expanded={open === index}
            >
              <span>{question}</span>
              {open === index ? <Minus size={22} strokeWidth={1.5} /> : <Plus size={22} strokeWidth={1.5} />}
            </button>
            <div className="faq-answer">
              <div className="faq-answer-inner">
                <p>{answer}</p>
              </div>
            </div>
          </div>
        ))}
      </section>
    </PublicLayout>
  );
}
