import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import './FAQ.css';

const faqs = [
    {
        question: "Is it hard for constellation elders (grandparents) to navigate our family universe?",
        answer: "Not at all! We've designed the interface with 'Universal Accessibility' in mind. Large touch targets, clear text, and intuitive navigation mean that if they can use a smartphone for calls, they can master Vacaverse."
    },
    {
        question: "Does our cosmic system work across both iPhone and Android galaxies?",
        answer: "Absolutely. Vacaverse is a cross-platform universe. Family members on iOS and Android can collaborate seamlessly in real-time."
    },
    {
        question: "What if a family member hasn't joined the smartphone universe yet?",
        answer: "No problem. You can add 'Satellite Members' to your constellation. Family planners can input their preferences and manage their itinerary for them."
    },
    {
        question: "Is our family constellation's cosmic data protected in your universe?",
        answer: "Security is our prime directive. We use banking-grade encryption and are SOC 2 certified. Your family's data stays in your private galaxy."
    },
    {
        question: "Can we explore the cosmic system before our family commits?",
        answer: "Yes! You can launch a free 'Test Flight' constellation for one trip to see how it works before upgrading to the full Universe plan."
    }
];

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section className="faq-section">
            <div className="container">
                <div className="faq-header">
                    <h2>Questions New Constellations Ask</h2>
                </div>

                <div className="faq-grid">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className={`faq-item ${openIndex === index ? 'open' : ''}`}
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <div className="faq-question">
                                <h3>{faq.question}</h3>
                                {openIndex === index ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                            <div className="faq-answer">
                                <p>{faq.answer}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQ;
