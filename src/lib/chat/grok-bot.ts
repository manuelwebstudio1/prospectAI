export function grokBotReply(message: string): string {
  const text = message.toLowerCase().trim();

  if (!text) {
    return "Ask me about ProspectAI — what it does, how it works, pricing, or how to start a workspace.";
  }

  if (/(price|pricing|cost|plan|pay|cedi|ghs|moolre)/.test(text)) {
    return "Plans are billed in Ghana Cedis through Moolre.\n\n• Starter — GH₵50/month (250 discoveries, 10 demos)\n• Professional — GH₵150/month (higher limits, unlimited demos)\n• Agency — GH₵350/month (team features and priority processing)\n\nYou can start a 14-day trial from Create workspace. Open /pricing for the full list.";
  }

  if (/(how it works|how does|workflow|steps|campaign)/.test(text)) {
    return "Here is the flow:\n\n1. Create a workspace and start a campaign (city, industry, website status).\n2. ProspectAI discovers businesses and checks whether they have a real website.\n3. Research is compiled from verified records only — we do not invent facts.\n4. A personalized unofficial demo site is generated.\n5. Outreach drafts wait for your approval. Nothing is sent until you say so.\n\nSee /how-it-works for the full walkthrough.";
  }

  if (/(sign up|signup|register|account|workspace|start|trial)/.test(text)) {
    return "Create a workspace at /register. You land in your dashboard after signup, with a 14-day Starter trial. No payment is required to explore.";
  }

  if (/(login|log in|sign in)/.test(text)) {
    return "Log in at /login. Platform admins go to the admin console. Everyone else opens their workspace dashboard.";
  }

  if (/(about|mission|vision|who are you|what is prospect)/.test(text)) {
    return "ProspectAI is an AI-powered business discovery and client acquisition platform for web developers, freelancers and agencies — Ghana first.\n\nWe believe finding clients should not be the hardest part of building a web business. The product discovers businesses, researches their operations, finds gaps in their online presence, and generates demo websites you can present to potential clients.\n\nRead more on /about.";
  }

  if (/(feature|discover|demo|outreach|website|research)/.test(text)) {
    return "ProspectAI includes:\n\n• Campaign-based business discovery\n• Website detection (never guessed as fact)\n• Structured research that refuses to invent details\n• Personalized unofficial demo websites\n• Approval-first email and WhatsApp outreach\n• A lightweight CRM for your pipeline\n\nDetails live on /features.";
  }

  if (/(contact|support|help|human|email)/.test(text)) {
    return "For partnerships or support, use /contact or email hello@prospectai.com. I can also answer product questions right here.";
  }

  if (/(hello|hi |hey|good morning|good evening|good afternoon)/.test(text)) {
    return "Hi — I am Grok, the ProspectAI bot. I can explain the product, pricing, how campaigns work, or how to create a workspace. What do you need?";
  }

  return "I am Grok, the ProspectAI bot. I can help with what the product does, how campaigns work, pricing in Ghana Cedis, or how to sign up.\n\nTry asking: “How does it work?”, “What are the plans?”, or “How do I start?”";
}
