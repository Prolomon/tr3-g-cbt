import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const OBJECTIVE_QUESTIONS = [
  {
    prompt: "What is the main operational purpose of the Support portal?",
    explanation:
      "Support brings together taxpayer registration, records, billing enquiries and case handling.",
    options: [
      "Assist taxpayers with entity records, payment enquiries, demand notices and complaints.",
      "Approve every field capture without review.",
      "Change tariff rates whenever a customer requests it.",
      "Replace verified payment records with verbal confirmations.",
    ],
    answer: "A",
  },
  {
    prompt: "Which sequence matches the Support entity-registration workflow?",
    explanation:
      "The registration wizard contains these five stages in this order.",
    options: [
      "Tariffs & Review → Location → Payment Confirmation → Password Reset → Approval.",
      "Center & Type → Entity Details → Property Details → Location → Tariffs & Review.",
      "Property Photos → Bank Transfer → Staff Creation → Department → Logout.",
      "Entity Details → Receipt Printing → Complaint Details → Property Deletion → Review.",
    ],
    answer: "B",
  },
  {
    prompt:
      "An existing property already has a registered owner. What occupancy classification should normally be used for a new tenant occupying it?",
    explanation:
      "The owner-status check helps distinguish an existing owner from other occupants.",
    options: [
      "TENANT.",
      "OWNER, because every business owns its premises.",
      "Supervisor.",
      "IT administrator.",
    ],
    answer: "A",
  },
  {
    prompt: "Which information best helps locate a specific payment record?",
    explanation: "Payment references and IDs identify the bill or payment record.",
    options: [
      "The colour of the taxpayer’s shop.",
      "The support officer’s personal phone PIN.",
      "A colleague’s unrelated receipt.",
      "Its payment reference or payment ID.",
    ],
    answer: "D",
  },
  {
    prompt:
      "A customer presents a transfer screenshot, but the system has not confirmed payment. What should Support do?",
    explanation:
      "A screenshot alone does not establish verified settlement; investigate the corresponding system record.",
    options: [
      "Mark the bill paid solely because the screenshot looks genuine.",
      "Delete the bill to prevent further enquiries.",
      "Ask the customer to send a banking password.",
      "Check the reference and system transaction evidence, then escalate the unresolved payment appropriately.",
    ],
    answer: "D",
  },
  {
    prompt:
      'The payment-page card is labelled “Total Revenue (2026)”. Which calculation matches the configured definition?',
    explanation:
      "The defined card measures 2026 billed amounts, rather than cash collected or a page subtotal.",
    options: [
      "Sum billed amounts for records whose paymentYear is 2026, within the applicable filters.",
      "Sum every amount paid across all payment years.",
      "Count all customers created during 2026.",
      "Add only the amounts visible on the current page.",
    ],
    answer: "A",
  },
  {
    prompt: "What does a demand notice primarily communicate?",
    explanation:
      "A demand notice requests settlement; a receipt or verified transaction establishes payment evidence.",
    options: [
      "That every listed bill has been paid.",
      "That a business has changed its address.",
      "That a property inspection is automatically approved.",
      "An assessment or amount due; it is not by itself proof of payment.",
    ],
    answer: "D",
  },
  {
    prompt:
      "What is the purpose of the QR code in the Secure Web Gateway card of a demand notice?",
    explanation:
      "The payment QR directs the reader to the checkout for that bill.",
    options: [
      "Change the registered business address.",
      "Erase an outstanding balance.",
      "Open the bill’s payment page.",
      "Approve a field capture.",
    ],
    answer: "C",
  },
  {
    prompt:
      "Which email address is displayed for enquiries on the current demand notice?",
    explanation:
      "The demand-notice enquiry address has been updated to support@amac-urms.ng.",
    options: [
      "info@amac-urms.ng.",
      "support@amac-urms.ng.",
      "support@amac-urms.com.",
      "payments@amac-support.net.",
    ],
    answer: "B",
  },
  {
    prompt:
      "A customer cannot provide their payment reference. What is the best next step?",
    explanation:
      "Use available entity details to find and confirm the correct payment record.",
    options: [
      "Guess a reference and use the first result.",
      "Tell the customer that the payment must be fraudulent.",
      "Use the entity’s identifying details to locate the correct record and confirm it with the customer.",
      "Create a new bill without checking existing records.",
    ],
    answer: "C",
  },
  {
    prompt:
      "Which pair is required when submitting a complaint through the Support form?",
    explanation:
      "The complaint form requires a clear title and description; category and priority organise the case.",
    options: [
      "A customer’s banking PIN and password.",
      "A complaint title and description.",
      "Only a verbal statement with no case details.",
      "A property video and staff payroll number.",
    ],
    answer: "B",
  },
  {
    prompt:
      "A complaint remains unresolved after your initial checks. What is the best response?",
    explanation:
      "A clear case history supports effective escalation and follow-up.",
    options: [
      "Guess a solution and change unrelated records.",
      "Close it without recording a reason.",
      "Promise a resolution time that has not been agreed.",
      "Document the checks already completed, escalate the unresolved issue and keep the customer informed.",
    ],
    answer: "D",
  },
  {
    prompt:
      "Why should a support officer confirm a customer’s contact details when reviewing an entity record?",
    explanation:
      "Accurate contact details support reliable customer communication and record quality.",
    options: [
      "To replace the need for a payment reference.",
      "To change the business category automatically.",
      "To guarantee that all outstanding bills disappear.",
      "To keep the record accurate and help ensure follow-up messages reach the right person.",
    ],
    answer: "D",
  },
  {
    prompt:
      "A business falls into more than one applicable tariff category. What should staff check?",
    explanation:
      "Applicable tariffs can produce multiple billing records for the same entity; verify the correct classification.",
    options: [
      "Assume one category automatically cancels all others.",
      "Each applicable assessment and payment record, ensuring the correct categories are linked to the entity.",
      "Create a separate business identity for every tariff without checking the existing entity.",
      "Replace every tariff amount with one guessed figure.",
    ],
    answer: "B",
  },
  {
    prompt:
      "A dashboard shows a request error and unavailable totals. What should the officer conclude?",
    explanation: "A failed request is different from a genuine zero result.",
    options: [
      "The database definitely contains no entities.",
      "The figures have not loaded successfully; investigate or retry before reporting a zero total.",
      "Every taxpayer has paid in full.",
      "The officer should create replacement records immediately.",
    ],
    answer: "B",
  },
  {
    prompt: "How many property photographs does the capture workflow require?",
    explanation:
      "The capture form and server enforce the three-to-eight photo requirement.",
    options: [
      "Exactly 1 photograph.",
      "A minimum of 10 photographs.",
      "No photographs if a property name is entered.",
      "A minimum of 3 and a maximum of 8.",
    ],
    answer: "D",
  },
  {
    prompt:
      "What should a field officer do if the capture form has no GPS location?",
    explanation: "The Field capture form requires a current GPS location.",
    options: [
      "Invent coordinates from memory.",
      "Enter the supervisor’s home coordinates.",
      "Submit another property’s location.",
      "Obtain a valid current location before submitting the capture.",
    ],
    answer: "D",
  },
  {
    prompt:
      "Which property information is required alongside the photographs?",
    explanation:
      "The capture workflow validates the property address before submission.",
    options: [
      "An employee’s personal bank balance.",
      "A customer’s mobile banking password.",
      "An unrelated business receipt.",
      "A physical property address.",
    ],
    answer: "D",
  },
  {
    prompt:
      "Which set of photographs is most useful for property identification?",
    explanation:
      "The capture page requests clear views that help identify and verify the premises.",
    options: [
      "Clear views of the building facade, entrance and surroundings.",
      "Three copies of an unrelated selfie.",
      "Blurred images with no identifiable premises.",
      "Screenshots of another officer’s capture.",
    ],
    answer: "A",
  },
  {
    prompt:
      "What happens immediately after a normal property capture is submitted?",
    explanation: "New captures are submitted for supervisor verification.",
    options: [
      "It enters the review process rather than becoming automatically approved.",
      "It automatically clears the occupant’s outstanding bills.",
      "It automatically registers every occupant of the property.",
      "It permanently removes the need for location checks.",
    ],
    answer: "A",
  },
  {
    prompt:
      "A supervisor denies a property capture. What should accompany that decision?",
    explanation:
      "The review workflow requires a reason when denying a capture.",
    options: [
      "A meaningful rejection reason.",
      "An empty explanation.",
      "A replacement customer password.",
      "An instruction to hide the record.",
    ],
    answer: "A",
  },
  {
    prompt:
      "What information should drive the selection of applicable tariffs during entity registration?",
    explanation:
      "Classification and location information determine the applicable assessments.",
    options: [
      "The field officer’s preferred amount.",
      "The entity’s business classification and the relevant location, zone and tariff rules.",
      "The customer’s willingness to pay an unofficial fee.",
      "The time remaining before the officer’s shift ends.",
    ],
    answer: "B",
  },
  {
    prompt:
      "What should an officer confirm before linking an entity to a registered property?",
    explanation:
      "Correct premises selection avoids linking a taxpayer to the wrong property.",
    options: [
      "Only that the property appears first in the list.",
      "The property ID/PID, address and actual premises correspond to the entity’s location.",
      "Only that its photo looks attractive.",
      "That its name matches the officer’s surname.",
    ],
    answer: "B",
  },
  {
    prompt:
      "You find an existing record that appears to be the same entity you are registering. What is the best first step?",
    explanation:
      "Check identifiers and details before creating another record; authorised import procedures may follow different rules.",
    options: [
      "Always create a new record without checking.",
      "Delete the existing record immediately.",
      "Verify the existing record before creating another entry.",
      "Change its identity to hide the match.",
    ],
    answer: "C",
  },
  {
    prompt:
      "A submission times out and its outcome is unknown. What should you do before submitting it repeatedly?",
    explanation:
      "Checking the submission outcome reduces accidental duplicate records.",
    options: [
      "Check whether the record was created, then retry or escalate based on the result.",
      "Press Submit continuously until several records appear.",
      "Assume every timeout means approval.",
      "Delete another officer’s record to make space.",
    ],
    answer: "A",
  },
  {
    prompt: "What is the purpose of the Assigned Tasks page?",
    explanation: "Tasks organise assigned work and its progress.",
    options: [
      "Display work orders assigned to the signed-in field or supervisor account.",
      "Allow every officer to approve their own payment.",
      "Reveal all users’ passwords.",
      "Replace the property-capture form.",
    ],
    answer: "A",
  },
  {
    prompt: "Which information is required to submit a field issue report?",
    explanation:
      "The report form validates a title and description and allows category and priority selection.",
    options: [
      "Only the officer’s favourite colour.",
      "A report title and description.",
      "A taxpayer’s OTP.",
      "An unrelated payment screenshot without explanation.",
    ],
    answer: "B",
  },
  {
    prompt:
      "What should a staff member do after using the portal on a shared device?",
    explanation:
      "Shared-device use requires protecting the session and customer information.",
    options: [
      "Leave the session open for the next user.",
      "Save the password in a public note.",
      "Sign out and avoid leaving customer information exposed.",
      "Send the session token to a colleague.",
    ],
    answer: "C",
  },
  {
    prompt:
      "How should photographs and taxpayer information be shared for work?",
    explanation:
      "Handle taxpayer evidence confidentially and through established work channels.",
    options: [
      "In unrestricted public social-media groups.",
      "Through established work channels while protecting customer confidentiality.",
      "Through anyone who requests them.",
      "With unrelated organisations for personal benefit.",
    ],
    answer: "B",
  },
  {
    prompt: "What is the best final check before submitting entity registration?",
    explanation:
      "The review stage is intended to catch incorrect or mismatched information.",
    options: [
      "Skip the review because required fields contain some text.",
      "Change every business to the cheapest category.",
      "Review the entity, premises, location and applicable tariffs for accuracy.",
      "Remove the property identifier to make the form shorter.",
    ],
    answer: "C",
  },
  {
    prompt: "What does SOP stand for?",
    explanation: "An SOP documents a consistent way to carry out a task.",
    options: [
      "System Ownership Password.",
      "Standard Operating Procedure.",
      "Staff Outstanding Payment.",
      "Supervisor Operational Plan.",
    ],
    answer: "B",
  },
  {
    prompt:
      "A customer requests a correction to a bill. What should a proposed Tr3-G SOP require first?",
    explanation:
      "A billing correction should begin with clear records and verification of the underlying facts.",
    options: [
      "Promise a reduction before examining the record.",
      "Delete the assessment immediately.",
      "Ask the customer to pay an unofficial correction fee.",
      "Record the complaint and compare the bill with the entity details and applicable tariff.",
    ],
    answer: "D",
  },
  {
    prompt:
      "Why should a proposed Tr3-G SOP require a clear case or activity history?",
    explanation:
      "A useful case history records actions, evidence, ownership and outcomes.",
    options: [
      "To expose confidential records publicly.",
      "To replace the need for accurate information.",
      "To support traceability, handovers and review of decisions.",
      "To guarantee that mistakes can never occur.",
    ],
    answer: "C",
  },
  {
    prompt:
      "A customer asks to pay a council bill into an officer’s personal account. What should the proposed SOP require?",
    explanation:
      "Use approved payment channels; personal-account collection should not be assumed authorised.",
    options: [
      "Direct the customer to approved payment channels and document or escalate the request if necessary.",
      "Accept it if the officer promises to remit later.",
      "Use an account belonging to a friend.",
      "Split the money privately with a colleague.",
    ],
    answer: "A",
  },
  {
    prompt:
      "Which approach best combines fraud prevention with customer service?",
    explanation:
      "Verification should be based on evidence and consistent controls, not prejudice.",
    options: [
      "Assume every customer is guilty.",
      "Ignore all verification to avoid upsetting customers.",
      "Use personal appearance as proof of fraud.",
      "Apply consistent verification checks while treating every customer respectfully.",
    ],
    answer: "D",
  },
  {
    prompt: "What does SWOT stand for?",
    explanation: "SWOT separates internal factors from external factors.",
    options: [
      "Staff, Workflows, Operations and Tariffs.",
      "Security, Wallets, Owners and Transactions.",
      "Strengths, Weaknesses, Opportunities and Threats.",
      "Support, Wards, Officers and Tasks.",
    ],
    answer: "C",
  },
  {
    prompt:
      "For a SWOT exercise, an effective GPS-enabled field workflow would normally be classified as what?",
    explanation:
      "A useful capability within the organisation is a potential strength.",
    options: [
      "An external threat.",
      "An external opportunity only.",
      "An internal strength.",
      "A customer complaint category.",
    ],
    answer: "C",
  },
  {
    prompt:
      "Insufficient staff training would normally be classified as what?",
    explanation: "An internal capability gap is a potential weakness.",
    options: [
      "An external opportunity.",
      "An external threat only.",
      "An internal weakness.",
      "A verified payment.",
    ],
    answer: "C",
  },
  {
    prompt:
      "An opportunity to partner with additional approved service organisations would normally be classified as what?",
    explanation:
      "A favourable external possibility is an opportunity until it is acted on.",
    options: [
      "An external opportunity.",
      "An internal weakness.",
      "An automatically realised strength.",
      "A property condition report.",
    ],
    answer: "A",
  },
  {
    prompt:
      "A phishing campaign targeting staff login credentials would normally be classified as what?",
    explanation: "An external event that can harm operations is a threat.",
    options: [
      "An internal strength.",
      "An entity-registration stage.",
      "An external threat.",
      "An approved tariff category.",
    ],
    answer: "C",
  },
]

const THEORY_QUESTIONS = [
  {
    prompt:
      "Describe the end-to-end Support process for registering a tenant business in an existing property.",
    explanation:
      "1. Identify the correct revenue center and entity/business classification (1 mark). 2. Record and verify entity and contact details (1 mark). 3. Select the correct registered property and check its owner status (1 mark). 4. Use TENANT where an owner already exists and verify the physical location (1 mark). 5. Review applicable tariffs and the final registration summary (1 mark). 6. Submit once, confirm the outcome and retain the entity/reference details (1 mark).",
  },
  {
    prompt:
      "State three checks to complete before submitting a valid property capture.",
    explanation:
      "1. Confirm that the physical address and selected premises identify the correct property (2 marks). 2. Confirm that valid current GPS coordinates have been obtained for the property (2 marks). 3. Confirm that 3–8 clear, relevant property photographs have been attached (2 marks).",
  },
  {
    prompt:
      "A customer says they paid, but their bill remains outstanding. Explain how you would investigate and communicate the outcome.",
    explanation:
      "1. Identify the correct entity and payment reference/ID (1 mark). 2. Check the amount, payment status and corresponding transaction evidence (1 mark). 3. Compare customer-provided evidence with system records without treating a screenshot as sufficient proof (1 mark). 4. Avoid marking paid or changing an assessment without the required verification and authority (1 mark). 5. Record and escalate a genuine unresolved mismatch through the approved channel (1 mark). 6. Explain the current status and next action clearly without making an unsupported promise (1 mark).",
  },
  {
    prompt:
      "A taxpayer complains that their business is attached to the wrong premises and tariff. Explain your response.",
    explanation:
      "1. Acknowledge the complaint professionally and clarify the facts (1 mark). 2. Log a clear title, description and relevant references (1 mark). 3. Select an appropriate category and priority using the approved criteria (1 mark). 4. Check entity, property/PID, location and tariff information against the evidence (1 mark). 5. Make only authorised corrections or route the case to the responsible officer (1 mark). 6. Record the outcome and communicate the update to the customer (1 mark).",
  },
  {
    prompt:
      "Explain how a support officer should handle an angry customer who believes their bill is incorrect.",
    explanation:
      "1. Remain calm and acknowledge the customer’s concern respectfully (1 mark). 2. Listen carefully and clarify the issue without interrupting or arguing (1 mark). 3. Confirm the correct entity and bill references (1 mark). 4. Check the assessment against the relevant business, property and tariff details (1 mark). 5. Explain the findings and next steps clearly without making unsupported promises (1 mark). 6. Record the complaint, escalate unresolved issues and provide an appropriate follow-up (1 mark).",
  },
  {
    prompt:
      "Draft the outline of a proposed Tr3-G SOP covering field property capture, supervisor review and handover to Support.",
    explanation:
      "1. State the purpose, scope, responsible roles and approval owner (1 mark). 2. Describe premises identification, address, GPS and photo evidence requirements (1 mark). 3. Describe validation, submission confirmation and failure handling (1 mark). 4. Describe supervisor approval/denial and recording a rejection reason (1 mark). 5. Describe the record/reference information and communication needed for the Support handover (1 mark). 6. Include exception escalation, document version control, staff training and periodic review (1 mark).",
  },
  {
    prompt:
      "What is SWOT? Write the full meaning of each letter and briefly explain the four parts.",
    explanation:
      "1. Expand SWOT correctly as Strengths, Weaknesses, Opportunities and Threats (1 mark). 2. Explain strengths as helpful internal capabilities or resources (1 mark). 3. Explain weaknesses as internal limitations or areas needing improvement (1 mark). 4. Explain opportunities as favourable external conditions or possibilities (1 mark). 5. Explain threats as external conditions that may harm operations (1 mark). 6. Distinguish the internal factors (strengths and weaknesses) from the external factors (opportunities and threats) (1 mark).",
  },
  {
    prompt:
      "Explain a safe handover when a field officer discovers incorrect property information that affects a taxpayer’s billing.",
    explanation:
      "1. Confirm the property/PID and the affected entity references (1 mark). 2. Record the discrepancy and supporting evidence accurately (1 mark). 3. Notify the responsible supervisor or Support case owner through an authorised channel (1 mark). 4. Avoid fabricating data or making an unauthorised billing adjustment (1 mark). 5. Ensure any approved correction and related assessment review are traceable (1 mark). 6. Confirm resolution and communicate the relevant update to the taxpayer and field team (1 mark).",
  },
  {
    prompt:
      "How can Tr3-G staff identify possible customer fraud, verify payment claims and still provide respectful customer service?",
    explanation:
      "1. Check the correct customer, entity and payment references (1 mark). 2. Compare payment claims with verified system transaction records (1 mark). 3. Identify inconsistencies and gather relevant evidence before reaching a conclusion (1 mark). 4. Avoid assuming guilt or using personal appearance as evidence of fraud (1 mark). 5. Document and escalate suspicious cases through the established work process (1 mark). 6. Communicate calmly and respectfully while protecting customer information (1 mark).",
  },
  {
    prompt:
      "Explain the difference between a demand notice and a payment receipt, and state when each should be used.",
    explanation:
      "1. Explain that a demand notice communicates an assessment or an amount due (1 mark). 2. State that a demand notice is used to request or remind a taxpayer to make payment (1 mark). 3. Explain that a receipt records evidence of a confirmed payment (1 mark). 4. State that a receipt should correspond to the verified payment transaction (1 mark). 5. Explain that entity, amount and reference details should match the relevant record (1 mark). 6. Make clear that receiving a demand notice does not by itself prove that payment has been made (1 mark).",
  },
]

const ANSWER_INDEX = { A: 0, B: 1, C: 2, D: 3 }

async function run() {
  // Ensure core roles exist and set ALL roles to 20 randomly shuffled questions per person
  const roleSeeds = [
    {
      name: "Support",
      description:
        "Support portal operations, taxpayer records, payments, and complaints",
    },
    {
      name: "Field",
      description: "Field property capture, GPS verification, and tasks",
    },
    {
      name: "Customer Service",
      description: "Frontline support, ticket resolution, and client communication",
    },
    {
      name: "Supervisor",
      description: "Team leadership, capture review, and escalation handling",
    },
  ]

  for (const r of roleSeeds) {
    await prisma.role.upsert({
      where: { name: r.name },
      update: { questionsPerAttempt: 20 },
      create: {
        name: r.name,
        description: r.description,
        questionsPerAttempt: 20,
      },
    })
  }

  // Update any other existing roles to also use 20 questions per attempt
  await prisma.role.updateMany({
    data: { questionsPerAttempt: 20 },
  })

  // Replace existing demo questions with the 50 Tr3-G CBT questions (All Roles)
  await prisma.question.deleteMany({})

  await prisma.question.createMany({
    data: [
      ...OBJECTIVE_QUESTIONS.map((q) => ({
        roleId: null,
        questionType: "objective",
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: ANSWER_INDEX[q.answer],
        explanation: q.explanation,
        points: 1,
        isActive: true,
      })),
      ...THEORY_QUESTIONS.map((q) => ({
        roleId: null,
        questionType: "theory",
        prompt: q.prompt,
        options: [],
        correctOptionIndex: -1,
        explanation: q.explanation,
        points: 1,
        isActive: true,
      })),
    ],
  })

  const totalObj = await prisma.question.count({
    where: { questionType: "objective" },
  })
  const totalTheory = await prisma.question.count({
    where: { questionType: "theory" },
  })
  const roles = await prisma.role.findMany({
    select: { name: true, questionsPerAttempt: true },
  })

  console.log(
    `Imported ${totalObj} objective + ${totalTheory} theory questions (All Roles).`
  )
  console.log("Roles configured:", roles)
}

run()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
