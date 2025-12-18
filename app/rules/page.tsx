import { Card } from "@/components/ui/card";

export const metadata = {
    title: "Rules - ByteHack",
    description: "Terms of Service and Legal Framework for ByteHack.",
};

export default function RulesPage() {
    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white/20">
            <div className="max-w-[900px] mx-auto px-6 py-12 md:py-16 space-y-6">

                {/* Header Section */}
                <div className="bg-[#0a0a0a] border border-white/5 rounded-[24px] p-8 md:p-12 mb-8">
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-zinc-500 uppercase mb-6">
                        LEGAL FRAMEWORK
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6">
                        BYTEHACK – TERMS OF SERVICE
                    </h1>

                    <p className="text-base text-zinc-400 leading-relaxed max-w-2xl">
                        Last updated: October 31, 2025. These Terms govern access to the ByteHack platform, forum, and subscription services. Using the Service means you agree to every section below.
                    </p>
                </div>

                {/* Section 1 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">1. Overview</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            ByteHack is an educational online platform providing community forums, technical discussions, and subscription-based access to specialized resources ("Subscription Services").
                        </p>
                        <p>
                            Our platform is provided solely for educational and informational purposes. By purchasing a ByteHack subscription, you are obtaining access to an online service, not purchasing digital goods or property.
                        </p>
                        <p>
                            Your continued access to ByteHack constitutes ongoing acceptance of these Terms and any future modifications we make.
                        </p>
                    </div>
                </Card>

                {/* Section 2 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">2. Definitions</h2>
                    <ul className="space-y-3 text-zinc-400 leading-relaxed text-sm list-disc list-inside">
                        <li>"User" means any person who visits, registers, or interacts with the Service.</li>
                        <li>"Content" includes text, data, images, code, comments, uploads, or any material transmitted through the Service.</li>
                        <li>"Subscription" means a paid tier granting access to specific parts of the Service for a defined period.</li>
                        <li>"Account" refers to a User profile registered on ByteHack's platform.</li>
                    </ul>
                </Card>

                {/* Section 3 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">3. Eligibility</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            You must be at least 13 years old (or the minimum legal age in your jurisdiction), have the legal capacity to enter into a binding contract, and use the Service for lawful and educational purposes only.
                        </p>
                        <p>
                            If you are under 18, you may use the Service only with the consent of a parent or guardian who agrees to be bound by these Terms on your behalf.
                        </p>
                    </div>
                </Card>

                {/* Section 4 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">4. Account Responsibility</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            You must provide accurate, current, and complete information when creating your ByteHack account and maintain the confidentiality of your login information.
                        </p>
                        <p>
                            You are fully responsible for all activity that occurs under your credentials. Sharing or selling accounts is strictly prohibited and will result in immediate termination without refund.
                        </p>
                        <p>
                            Notify ByteHack immediately if you suspect unauthorized use or access to your account.
                        </p>
                    </div>
                </Card>

                {/* Section 5 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">5. Subscriptions and Payments</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            All payments made to ByteHack are for access to an online subscription service. You are not purchasing downloadable software, digital files, or any tangible or intangible product.
                        </p>
                        <p>
                            Payments are processed securely through approved payment providers. Subscriptions renew automatically unless canceled before the next billing cycle.
                        </p>
                        <p>
                            Access continues until the end of the billing period unless terminated earlier by ByteHack or by you. Users are responsible for all applicable taxes, fees, or duties imposed by their jurisdiction.
                        </p>
                    </div>
                </Card>

                {/* Section 6 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">6. Zero Refund Policy</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            ByteHack maintains a strict zero-refund policy. All payments, including renewals, are final and non-refundable, regardless of the reason. This includes, but is not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Accidental purchases or renewals</li>
                            <li>Dissatisfaction with content or features</li>
                            <li>Account termination for violation of Terms</li>
                            <li>Partial use of the subscription period</li>
                        </ul>
                    </div>
                </Card>

                {/* Section 7 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">7. Chargebacks and Payment Disputes</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            Chargebacks and payment disputes cause serious harm to our operations. By using our Service, you agree to refrain from initiating any chargeback or payment dispute through your financial institution or payment processor.
                        </p>
                        <p>
                            All disputes must be handled directly with ByteHack by emailing luainterpreter@bytehack.net. If you initiate a chargeback, ByteHack reserves the right to terminate your account, permanently ban associated access, and pursue legal action to recover the disputed amount plus all related costs.
                        </p>
                        <p>
                            Any chargeback constitutes a material breach of this contract, and you will be liable for all resulting financial losses, attorney fees, and related expenses.
                        </p>
                    </div>
                </Card>

                {/* Section 8 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">8. Prohibited Conduct</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            You may not engage in or encourage any of the following activities on or through ByteHack: piracy/copyright infringement, data scraping or automation, account sharing or resale, hacking or unauthorized access, denial-of-service attacks, malicious behavior, illegal or unethical use, circumvention of security measures, or interference with site operation.
                        </p>
                        <p>
                            ByteHack reserves the right to suspend or terminate any User violating these restrictions and to pursue all available civil or criminal remedies.
                        </p>
                    </div>
                </Card>

                {/* Section 9 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">9. Enforcement and Termination</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            ByteHack may suspend, limit, or permanently terminate any account at its sole discretion for violations of these Terms or suspected misuse. No refund or credit will be given upon termination.
                        </p>
                        <p>
                            We may use technical measures such as IP bans, access restrictions, or data removal to enforce compliance and may refer serious violations to law enforcement authorities.
                        </p>
                    </div>
                </Card>

                {/* Section 10 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">10. Intellectual Property Rights</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            All materials on ByteHack — including text, code, images, designs, and trademarks — are the intellectual property of ByteHack or its licensors.
                        </p>
                        <p>
                            You may not copy, modify, distribute, or reuse any portion of the Service without written permission. The ByteHack name and logo are protected trademarks.
                        </p>
                    </div>
                </Card>

                {/* Section 11 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">11. User Content License</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            You retain ownership of your original content, but by posting or submitting it on ByteHack, you grant ByteHack a worldwide, royalty-free, non-exclusive, sublicensable, and transferable license to use, reproduce, distribute, display, and adapt that content in connection with operating and promoting the Service.
                        </p>
                    </div>
                </Card>

                {/* Section 12 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">12. Indemnification</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            You agree to defend, indemnify, and hold harmless ByteHack, its owners, operators, employees, affiliates, and partners from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees and court costs) arising from your use of the Service, your breach of these Terms, any dispute or chargeback you initiate, or any violation of applicable laws or third-party rights.
                        </p>
                    </div>
                </Card>

                {/* Section 13 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">13. Disclaimer of Warranties</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            The Service is provided "AS IS" and "AS AVAILABLE." ByteHack makes no representations or warranties of any kind, express or implied, including but not limited to merchantability or fitness for a particular purpose, reliability, accuracy, availability, security, or error-free performance. Your use of the Service is entirely at your own risk.
                        </p>
                    </div>
                </Card>

                {/* Section 14 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">14. Limitation of Liability</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            To the maximum extent permitted by law, ByteHack shall not be liable for any indirect, incidental, consequential, special, or punitive damages, including loss of data, profits, or business. In no event shall ByteHack's total liability exceed the total amount you paid for access in the 12 months preceding the event giving rise to the claim.
                        </p>
                        <p>
                            Some jurisdictions do not allow limitations of certain damages; in such cases, ByteHack's liability shall be limited to the maximum extent allowed by law.
                        </p>
                    </div>
                </Card>

                {/* Section 15 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">15. Governing Law and Jurisdiction</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            These Terms shall be governed by and construed in accordance with the laws of England and Wales. All disputes shall be resolved exclusively in the courts of England, and you consent to their jurisdiction.
                        </p>
                        <p>
                            If ByteHack must pursue enforcement or collection due to your breach (including chargebacks or violations), you agree to be liable for all legal and court costs incurred by ByteHack in that process.
                        </p>
                    </div>
                </Card>

                {/* Section 16 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">16. Modifications to Terms</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            ByteHack may update or modify these Terms at any time. Changes will be posted on the Service with a new "Last Updated" date. Material changes will be communicated by email or site notice.
                        </p>
                        <p>
                            Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.
                        </p>
                    </div>
                </Card>

                {/* Section 17 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">17. Severability</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            If any provision of these Terms is held invalid or unenforceable, the remaining provisions shall remain in full effect.
                        </p>
                    </div>
                </Card>

                {/* Section 18 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">18. Entire Agreement</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            These Terms, along with any referenced policies, represent the entire agreement between you and ByteHack and supersede all prior agreements, representations, or understandings.
                        </p>
                    </div>
                </Card>

                {/* Section 19 */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">19. Contact Information</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            For legal inquiries, disputes, or policy questions, contact luainterpreter@bytehack.net.
                        </p>
                    </div>
                </Card>

                {/* Footer Contact Section */}
                <Card className="bg-[#0a0a0a] border-white/5 p-6 md:p-8 rounded-[24px]">
                    <h2 className="text-lg font-bold text-white mb-4">Need to reach us?</h2>
                    <div className="space-y-4 text-zinc-400 leading-relaxed text-sm">
                        <p>
                            For legal inquiries, disputes, or policy questions, email <a href="mailto:luainterpreter@bytehack.net" className="text-white hover:underline">luainterpreter@bytehack.net</a>. Provide supporting documentation where possible to ensure a prompt response.
                        </p>
                    </div>
                </Card>

            </div>
        </div>
    );
}
