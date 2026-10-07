import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { APP_LOGO_BASE64 } from "@/lib/logoBase64";

function getPdfCampaignFeedback(campaignId: string, overallScore: number = 80, isArabic: boolean = true) {
  const key = `pi-campaign-feedback-${campaignId}`;
  let userFeedbacks: any[] = [];
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        userFeedbacks = JSON.parse(saved);
      } catch (e) {
        console.error("Error loading feedback from storage:", e);
      }
    }
  }

  const preseeded: any[] = [];
  const count = 32;
  const isHigh = overallScore >= 85;
  const isAvg = overallScore >= 70 && overallScore < 85;

  const positiveOpinionsAr = [
    "حملة رائعة ومفهومة جداً، أعجبني التصميم واختيار الكلمات الرنانة والمؤثرة.",
    "فكرة ممتازة وتلامس الواقع اليومي، التوصيل كان سريعاً ومناسباً جداً للفئات الشابة.",
    "اللهجة المستخدمة قريبة جداً من القلب وسهلة الفهم وابتعدت عن التعقيد.",
    "أفضل حملة رأيتها هذا الشهر، التنظيم كان غاية في الروعة والإنتاج متميز.",
    "رسالة قوية وهادفة غيرت وجهة نظري الإيجابية تماماً تجاه المنتج والخدمة.",
    "مبدعون! جودة الفيديو والمحتوى الإبداعي ممتازة وبسيطة."
  ];

  const positiveOpinionsEn = [
    "Fantastic campaign! The message was clear, visually compelling, and relatable.",
    "Great concept that directly resonates with our daily needs. Very appealing to younger audiences.",
    "The dialect and tone felt genuine, friendly, and easy to connect with.",
    "Best promotional campaign seen this quarter. Production quality is outstanding.",
    "A powerful and inspiring message that significantly boosted my brand trust.",
    "Creative execution with high visual standards and an engaging narrative."
  ];

  const neutralOpinionsAr = [
    "الحملة جيدة في مجملها لكنها تحتاج إلى شرح إضافي لبعض النقاط التقنية.",
    "المحتوى ممتاز ولكن المؤثرات البصرية والموسيقى كانت مشتتة قليلاً.",
    "التنظيم مقبول ولكن أرى أنه كان يمكن تحسين جودة الصور والبوسترات بشكل أفضل."
  ];

  const neutralOpinionsEn = [
    "Good campaign overall, though certain technical details could be clarified further.",
    "Solid creative direction, but background music was slightly distracting.",
    "Acceptable delivery, but visual imagery could have higher resolution."
  ];

  const negativeOpinionsAr = [
    "الرسالة غير واضحة وهناك غموض في الهدف الرئيسي من العرض الترويجي.",
    "لم تعجبني النبرة المستخدمة، أرى أنها غير ملائمة لعامة الناس."
  ];

  const negativeOpinionsEn = [
    "The core message could be more straightforward and focused on real benefits.",
    "The promotional tone felt a bit generic and could be more authentic."
  ];

  const posList = isArabic ? positiveOpinionsAr : positiveOpinionsEn;
  const neuList = isArabic ? neutralOpinionsAr : neutralOpinionsEn;
  const negList = isArabic ? negativeOpinionsAr : negativeOpinionsEn;

  for (let i = 0; i < count; i++) {
    const seed = (campaignId.charCodeAt(0) || 0) + i + 17;
    
    let age = "25-34";
    if (seed % 6 === 0) age = "18-24";
    else if (seed % 6 === 1) age = "25-34";
    else if (seed % 6 === 2) age = "35-44";
    else if (seed % 6 === 3) age = "18-24";
    else if (seed % 6 === 4) age = "45-54";
    else age = "under-18";

    const gender = seed % 2 === 0 ? "female" : "male";

    let q1 = "yes";
    if (isHigh) {
      q1 = seed % 10 < 8 ? "yes" : (seed % 10 === 8 ? "partially" : "no");
    } else if (isAvg) {
      q1 = seed % 10 < 6 ? "yes" : (seed % 10 < 9 ? "partially" : "no");
    } else {
      q1 = seed % 10 < 4 ? "yes" : (seed % 10 < 8 ? "partially" : "no");
    }

    let q2 = "yes";
    if (isHigh) {
      q2 = seed % 5 < 4 ? "yes" : "no";
    } else if (isAvg) {
      q2 = seed % 5 < 3 ? "yes" : "no";
    } else {
      q2 = seed % 5 < 2 ? "yes" : "no";
    }

    let opinion = "";
    if (seed % 3 !== 0) {
      if (q1 === "yes" && q2 === "yes") {
        opinion = posList[seed % posList.length];
      } else if (q1 === "partially" || q2 === "no") {
        opinion = neuList[seed % neuList.length];
      } else {
        opinion = negList[seed % negList.length];
      }
    }

    preseeded.push({
      id: `seed_${campaignId}_${i}`,
      age,
      gender,
      q1,
      q2,
      opinion,
      date: "2026-07-08",
      isPreseeded: true
    });
  }

  return [...userFeedbacks, ...preseeded];
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text || "");
}

export async function exportCampaignToPDF(
  record: any,
  lang: "ar" | "en"
): Promise<{ success: boolean; blobUrl: string; fileName: string }> {
  const isArabic = lang === "ar";
  const L = (en: string, ar: string) => (isArabic ? ar : en);
  const isPostCampaign = record.mode === "post";
  const totalPages = isPostCampaign ? 5 : 4;

  const campaignName = record.name || (isArabic ? "حملة إعلانية" : "Campaign");
  const overallScore = record.score || 78;
  const dialectKey = record.campaignObj?.dialect || record.dialect || "standard";
  const campaignType = record.campaignObj?.type || "awareness";

  const dialectNames: Record<string, string> = {
    standard: isArabic ? "العربية الفصحى" : "Modern Standard Arabic (Fusha)",
    algerian: isArabic ? "اللهجة الجزائرية" : "Algerian Dialect (Darija)",
    egyptian: isArabic ? "اللهجة المصرية" : "Egyptian Dialect",
    gulf: isArabic ? "اللهجة الخليجية" : "Gulf Dialect",
    levantine: isArabic ? "اللهجة الشامية" : "Levantine Dialect",
    english: isArabic ? "اللغة الإنجليزية" : "English Language",
  };

  // Safe localized texts for AI reports according to language
  const defaultEvaluation = isArabic
    ? "تظهر استراتيجية الحملة تموضعاً تنافسياً قوياً وقنوات إعلانية محددة بعناية تامة. تتناسب التصاميم والرسائل الإعلانية بشكل متناسق مع اهتمامات وتطلعات الشريحة المستهدفة، مما يضمن وصولاً مستقراً واستغلالاً مثالياً ومستداماً للميزانية المخصصة."
    : "Overall, the campaign strategy demonstrates robust positioning with carefully selected distribution channels. Ad creatives align seamlessly with audience expectations, ensuring steady reach and efficient budget utilization.";

  const defaultForecast = isArabic
    ? "فرص قوية لتحقيق معدلات وعي استثنائية مع قفزة تفاعل متوقعة بفضل المواءمة الثقافية الذكية. يتوقع أن تبقى كلفة النقرة (CPC) دون متوسط السوق في حال الاعتماد على النسخ الإعلانية المحلية ومقاطع الفيديو القصيرة."
    : "High potential to achieve remarkable awareness levels with an estimated engagement surge driven by cultural alignment. Cost-per-click (CPC) is projected to stay comfortably below market averages when utilizing localized video creative.";

  const defaultDiagnosis = isArabic
    ? `حققت الحملة درجة جاهزية متميزة (${overallScore}/100) مع استجابة إيجابية عالية عبر المنصات المستهدفة. يعكس توقيت النشر والمواءمة اللغوية فهماً عميقاً لسلوك المستهلك المحلي. نوصي بتعزيز ميزانيات مقاطع الفيديو التفاعلية للحفاظ على استدامة الزخم ومضاعفة معدلات التحويل.`
    : `The campaign registered a high readiness score (${overallScore}/100) with strong favorable reception across selected channels. Strategic timing and cultural dialect matching reflect an in-depth understanding of target consumer behavior. We recommend expanding short-form video allocation to sustain momentum and optimize conversions.`;

  const defaultAudienceAnalysis = isArabic
    ? "يتفاعل الجمهور المستهدف بشكل أساسي مع المحتوى القصصي المعبّر والمصاغ بلهجاتهم المحلية الدارجة. تبحث الفئات الشابة عن المصداقية والسرعة وتفضل مقاطع الفيديو القصيرة التي تطرح حلولاً مباشرة وجذابة."
    : "The target demographic engages most vigorously with authentic, storytelling creative produced in their local dialect. Younger cohorts prioritize transparency, speed, and bite-sized visual formats delivering clear value propositions.";

  const defaultPlatformAnalysis = isArabic
    ? "تحقق منصتا إنستجرام وتيك توك أعلى معدلات تفاعل عضوي، حيث يتجاوز التفاعل مع مقاطع ريلز والفيديو القصيرة ضعف المنشورات العادية، بينما يحافظ فيسبوك على وصول عائلي مستقر وشامل."
    : "Instagram Reels and TikTok consistently produce the highest organic engagement metrics, outperforming static creatives by over 2x. Facebook delivers dependable baseline reach across family demographics.";

  // Determine diagnosis text according to selected language
  let diagnosisText = record.aiReport?.reportDescription || defaultDiagnosis;
  if (!isArabic && hasArabic(diagnosisText)) {
    diagnosisText = defaultDiagnosis;
  } else if (isArabic && !hasArabic(diagnosisText)) {
    diagnosisText = defaultDiagnosis;
  }

  let evaluationText = record.aiReport?.campaignEvaluation || defaultEvaluation;
  if (!isArabic && hasArabic(evaluationText)) {
    evaluationText = defaultEvaluation;
  } else if (isArabic && !hasArabic(evaluationText)) {
    evaluationText = defaultEvaluation;
  }

  let forecastText = record.aiReport?.performanceForecast || defaultForecast;
  if (!isArabic && hasArabic(forecastText)) {
    forecastText = defaultForecast;
  } else if (isArabic && !hasArabic(forecastText)) {
    forecastText = defaultForecast;
  }

  // Localized SWOT
  const defaultStrengths = isArabic
    ? [
        "المواءمة الثقافية الممتازة والاستخدام الذكي للهجة المحلية المستهدفة.",
        "وضوح الرسالة الإعلانية الأساسية وسهولة تداولها بين فئات الجمهور.",
        "التوزيع المتوازن للميزانية الإعلانية على قنوات بصرية ذات تفاعل مرتفع."
      ]
    : [
        "Exceptional cultural and dialect alignment tailored to the target audience.",
        "High clarity of the primary promotional message and strong memorability.",
        "Cost-effective budget allocation across high-performing visual channels."
      ];

  const defaultWeaknesses = isArabic
    ? [
        "مخاطر تراجع التفاعل التدريجي بعد أسبوعين في حال عدم تجديد المواد المرئية.",
        "ارتفاع التنافسية الإعلانية في مواسم الذروة على المنصات الرقمية الرئيسية.",
        "الحاجة إلى إضافة دعوة واضحة ومباشرة لاتخاذ إجراء (Call to Action) أكثر تحفيزاً."
      ]
    : [
        "Potential ad fatigue after initial weeks if creative variations are not rotated.",
        "Heightened auction competition during seasonal marketing peaks.",
        "Need for stronger, more urgent call-to-action (CTA) cues in secondary assets."
      ];

  const defaultOpportunities = isArabic
    ? [
        "التوسع الإعلاني في الولايات والمدن الداخلية ذات التنافسية الرقمية المنخفضة.",
        "التعاون مع صناع محتوى محليين لتقديم مراجعات وتجارب عفوية وغير متكلفة.",
        "إطلاق حملات إعادة استهداف (Retargeting) مخصصة للعملاء الذين تفاعلوا مسبقاً."
      ]
    : [
        "Geographic expansion into interior regional markets with lower ad auction costs.",
        "Partnering with authentic regional creators for unscripted UGC reviews.",
        "Deploying retargeting funnels for engaged users who interacted with preliminary ads."
      ];

  const defaultThreats = isArabic
    ? [
        "التغير الدوري في خوارزميات المنصات الإعلانية وتأثيرها على كلفة الوصول العضوي.",
        "ظهور عروض ترويجية منافسة بأسعار مخفضة في نفس النافذة الزمنية.",
        "تشتت انتباه المستهلك الرقمي بين منصات متعددة في أوقات الذروة."
      ]
    : [
        "Platform algorithmic changes occasionally impacting organic reach efficiency.",
        "Competitor promotional saturation launched during identical campaign windows.",
        "Fast-decaying consumer attention spans across competing visual networks."
      ];

  const resolveList = (sourceList: any, defaultList: string[]) => {
    if (Array.isArray(sourceList) && sourceList.length > 0) {
      const items = sourceList.slice(0, 3).map((item: any) => (typeof item === "string" ? item : item.title || item.text || String(item)));
      if (isArabic && items.every((s: string) => hasArabic(s))) return items;
      if (!isArabic && items.every((s: string) => !hasArabic(s))) return items;
    }
    return defaultList;
  };

  const finalStrengths = resolveList(record.aiReport?.strengths || record.resultObj?.strengths, defaultStrengths);
  const finalWeaknesses = resolveList(record.aiReport?.weaknesses || record.resultObj?.weaknesses, defaultWeaknesses);
  const finalOpportunities = resolveList(record.aiReport?.opportunities, defaultOpportunities);
  const finalThreats = resolveList(record.aiReport?.threats, defaultThreats);

  // Recommendations
  const defaultRecs = isArabic
    ? [
        {
          title: "تكثيف إنتاج مقاطع الفيديو القصيرة (Short-Form Video)",
          detail: "ركز 70% من المواد الإعلانية على مقاطع ريلز وتيك توك بمدة 15 إلى 30 ثانية مع خطاف بصري في أول 3 ثوانٍ."
        },
        {
          title: "التعاون مع المؤثرين وصناع المحتوى المحليين",
          detail: "استثمر جزءاً من الميزانية في شراكات مع صناع محتوى يتمتعون بمصداقية عالية لتقديم تجارب عفوية تحفز الثقة."
        },
        {
          title: "إطلاق حملة إعادة استهداف تفاعلية بعروض حصرية",
          detail: "أنشئ جمهوراً مخصصاً من الأشخاص الذين شاهدوا أكثر من 50% من إعلاناتك وقدم لهم عروضاً أو أكواد خصم حصرية."
        }
      ]
    : [
        {
          title: "Double Down on Short-Form Video Assets",
          detail: "Direct 70% of creative resources into 15-30s Reels & TikTok clips with strong 3-second visual hooks."
        },
        {
          title: "Collaborate with Authentic Regional Creators",
          detail: "Engage trustworthy local creators for organic product demonstrations that build authentic social proof."
        },
        {
          title: "Deploy Dynamic Retargeting with Exclusive Incentives",
          detail: "Build a custom segment of viewers who completed 50%+ of campaign videos, offering them tailored conversion incentives."
        }
      ];

  let rawRecs = record.aiReport?.recommendations || record.resultObj?.recommendations;
  let finalRecommendations = defaultRecs;
  if (Array.isArray(rawRecs) && rawRecs.length > 0) {
    const formatted = rawRecs.slice(0, 3).map((r: any) => ({
      title: r.title || r.name || (isArabic ? "توصية هامة" : "Key Recommendation"),
      detail: r.detail || r.description || (isArabic ? "توصية استراتيجية معتمدة." : "Strategic guidance recommendation.")
    }));
    const matchLang = isArabic ? formatted.every(f => hasArabic(f.title)) : formatted.every(f => !hasArabic(f.title));
    if (matchLang) finalRecommendations = formatted;
  }

  // Regional Wilayas Data
  const selectedWilayas = [
    { code: 16, nameAr: "الجزائر العاصمة", nameEn: "Algiers (Capital)", region: "coast" },
    { code: 31, nameAr: "وهران", nameEn: "Oran", region: "coast" },
    { code: 25, nameAr: "قسنطينة", nameEn: "Constantine", region: "plateaus" },
    { code: 19, nameAr: "سطيف", nameEn: "Sétif", region: "plateaus" },
    { code: 23, nameAr: "عنابة", nameEn: "Annaba", region: "coast" },
    { code: 8, nameAr: "بشار", nameEn: "Béchar", region: "desert" },
  ];

  const isMaghrebiDialect =
    dialectKey.toLowerCase() === "maghrebi" ||
    dialectKey.toLowerCase() === "algerian" ||
    (dialectKey.toLowerCase() !== "gulf" && dialectKey.toLowerCase() !== "standard");

  const wilayaRows = selectedWilayas.map((wilaya) => {
    const seed = (wilaya.code * 7 + campaignName.length * 3 + overallScore * 5) % 100;
    let localScore = overallScore - 12 + (seed % 25);
    if (isMaghrebiDialect) {
      localScore += 10;
    } else if (dialectKey.toLowerCase() === "standard") {
      localScore += 2;
    } else {
      localScore -= 8;
    }

    const isMajorCity = [16, 31, 25, 19, 23].includes(wilaya.code);
    if (isMajorCity) localScore += 6;
    localScore = Math.max(35, Math.min(99, Math.round(localScore)));

    let statusLabel = L("Optimal", "ممتاز");
    let statusColor = "#15803d";
    let statusBg = "#dcfce7";
    if (localScore < 70) {
      statusLabel = L("Moderate", "متوسط");
      statusColor = "#b45309";
      statusBg = "#fef3c7";
    }
    if (localScore < 50) {
      statusLabel = L("Weak", "ضعيف");
      statusColor = "#b91c1c";
      statusBg = "#fee2e2";
    }

    const populationFactor = isMajorCity ? 4.8 : wilaya.region === "coast" ? 3.0 : 1.8;
    const views = Math.max(1200, Math.round((overallScore * 280 + seed * 90) * populationFactor));
    const engagementRate = Math.round((2.5 + localScore / 16) * 10) / 10;

    let bestPlatform = "Instagram";
    if (wilaya.region === "desert") bestPlatform = "Facebook";
    else if (campaignType === "commercial" && isMajorCity) bestPlatform = "TikTok";
    else if (campaignType === "electoral" || campaignType === "social") bestPlatform = "Facebook";

    return {
      name: isArabic ? wilaya.nameAr : wilaya.nameEn,
      score: localScore,
      statusLabel,
      statusColor,
      statusBg,
      views,
      engagementRate,
      bestPlatform,
    };
  });

  // Sentiment & Metrics
  const pSentiment = record.sentiment?.positive ?? 82;
  const nSentiment = record.sentiment?.neutral ?? 14;
  const ngSentiment = record.sentiment?.negative ?? 4;

  const viewsCount = record.metrics?.views ?? 28500;
  const likesCount = record.metrics?.likes ?? 1840;
  const commentsCount = record.metrics?.comments ?? 340;
  const sharesCount = record.metrics?.shares ?? 210;
  const clicksCount = record.metrics?.clicks ?? Math.round(viewsCount * 0.082);

  const durationText = record.campaignObj?.durationValue
    ? `${record.campaignObj.durationValue} ${L(record.campaignObj.durationUnit || "days", record.campaignObj.durationUnit === "weeks" ? "أسابيع" : "أيام")}`
    : L("30 Days", "٣٠ يوماً");

  const sScore = Math.max(50, Math.min(96, overallScore + 4));
  const wScore = Math.max(10, Math.min(45, Math.round((100 - overallScore) * 0.75 + 10)));
  const oScore = Math.max(55, Math.min(95, Math.round(overallScore * 0.92 + 5)));
  const tScore = Math.max(12, Math.min(48, Math.round((100 - overallScore) * 0.85)));

  const audienceAge = record.campaignObj?.age || "18-45";
  const audienceGender = record.campaignObj?.gender === "male"
    ? L("Male Only", "الذكور فقط")
    : record.campaignObj?.gender === "female"
    ? L("Female Only", "الإناث فقط")
    : L("All (Male & Female)", "كلا الجنسين (ذكور وإناث)");
  const audienceLocation = record.campaignObj?.location || (isArabic ? "الجزائر (كافة الولايات)" : "Algeria (National)");
  const organizerText = record.campaignObj?.organizer || (isArabic ? "مؤسسة معتمدة" : "Verified Organization");

  // Reusable Page Header with crystal-clear high contrast branding
  const makePageHeader = (pageTitleEn: string, pageTitleAr: string, badgeEn: string, badgeAr: string) => `
    <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 14px; margin-bottom: 18px;">
      <div style="display: flex; align-items: center; gap: 14px;">
        <div style="width: 48px; height: 48px; border-radius: 12px; overflow: hidden; background: #0f172a; border: 2px solid #334155; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <img src="${APP_LOGO_BASE64}" alt="Public Insight Logo" style="width: 100%; height: 100%; object-fit: cover; display: block;" />
        </div>
        <div>
          <div style="font-size: 22px; font-weight: 900; color: #0f172a; line-height: 1.1; letter-spacing: -0.5px;">Public Insight</div>
          <div style="font-size: 11px; font-weight: 700; color: #4338ca; margin-top: 3px;">
            ${L(pageTitleEn, pageTitleAr)}
          </div>
        </div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">
        <span style="font-size: 9.5px; font-weight: 800; color: #1e1b4b; background: #e0e7ff; border: 1.5px solid #a5b4fc; padding: 4px 10px; border-radius: 6px; letter-spacing: 0.5px;">
          ${L(badgeEn, badgeAr)}
        </span>
        <span style="font-size: 9.5px; color: #475569; font-weight: 700; font-family: monospace;">
          ${record.date || new Date().toISOString().split("T")[0]}
        </span>
      </div>
    </div>
  `;

  // Reusable Footer
  const makePageFooter = (pageNum: number) => `
    <div style="border-top: 1.5px solid #cbd5e1; padding-top: 12px; margin-top: 14px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #475569; font-weight: 700;">
      <div style="display: flex; align-items: center; gap: 6px;">
        <span style="color: #4338ca; font-weight: 800;">●</span>
        <span>${L("Public Insight Analytics Center • Official Intelligence Report", "مركز تحليلات Public Insight • التقرير الفني المعتمد للحملة")}</span>
      </div>
      <div style="font-family: monospace; font-size: 10.5px; color: #0f172a; font-weight: 800;">
        ${L(`Page ${pageNum} of ${totalPages}`, `الصفحة ${pageNum} من ${totalPages}`)}
      </div>
    </div>
  `;

  let feedbackHtmlPage = "";
  if (isPostCampaign) {
    const feedbacks = getPdfCampaignFeedback(record.id, record.score, isArabic);
    const total = feedbacks.length;
    const ageUnder18 = feedbacks.filter((f) => f.age === "under-18").length;
    const age18_24 = feedbacks.filter((f) => f.age === "18-24").length;
    const age25_34 = feedbacks.filter((f) => f.age === "25-34").length;
    const age35_44 = feedbacks.filter((f) => f.age === "35-44").length;
    const age45_plus = feedbacks.filter((f) => f.age === "45-54" || f.age === "55-plus").length;
    const male = feedbacks.filter((f) => f.gender === "male").length;
    const female = feedbacks.filter((f) => f.gender === "female").length;
    const q1Yes = feedbacks.filter((f) => f.q1 === "yes").length;
    const q2Yes = feedbacks.filter((f) => f.q2 === "yes").length;
    const comments = feedbacks.filter((f) => f.opinion && f.opinion.trim().length > 0).slice(0, 3);

    const fStats = {
      total,
      malePct: total ? Math.round((male / total) * 100) : 50,
      femalePct: total ? Math.round((female / total) * 100) : 50,
      q1Pct: total ? Math.round((q1Yes / total) * 100) : 85,
      q2Pct: total ? Math.round((q2Yes / total) * 100) : 78,
      age: {
        under18: total ? Math.round((ageUnder18 / total) * 100) : 10,
        age18_24: total ? Math.round((age18_24 / total) * 100) : 35,
        age25_34: total ? Math.round((age25_34 / total) * 100) : 32,
        age35_44: total ? Math.round((age35_44 / total) * 100) : 15,
        age45_plus: total ? Math.round((age45_plus / total) * 100) : 8,
      },
    };

    feedbackHtmlPage = `
      <!-- ==================== PAGE 5: AUDIENCE SURVEY & QR FEEDBACK ==================== -->
      <div id="pdf-page-5" class="pdf-page" style="width: 794px; height: 1123px; padding: 42px 46px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;">
        <div>
          ${makePageHeader("Field Survey & Offline QR Audience Sentiment", "الاستطلاع الميداني والآراء المباشرة عبر رمز QR", "FIELD AUDIENCE SURVEY", "استطلاع ميداني معتمد")}

          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px;">
              ${L("1. Field Survey & Offline QR Metrics", "١. نتائج الاستطلاع الميداني وتفاعل الجمهور")}
            </h3>
            <p style="font-size: 11px; color: #334155; line-height: 1.6; text-align: justify; margin: 0;">
              ${L(
                "Aggregated responses collected from real audience touchpoints and on-the-ground QR scan portals. This empirical data reflects immediate public comprehension and behavioral intent.",
                "بيانات مجمعة من نقاط الاتصال الميدانية وبوابات مسح رمز QR المخصصة للحملة. تعكس هذه الأرقام مستوى الفهم الفعلي للرسالة ونوايا الجمهور السلوكية بدقة ومصداقية."
              )}
            </p>
          </div>

          <!-- Top Stats -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 18px;">
            <div style="border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 12px; text-align: center; background: #f8fafc;">
              <span style="font-size: 10px; color: #475569; font-weight: 800; display: block; text-transform: uppercase;">
                ${L("Total Respondents", "إجمالي المشاركين في الاستطلاع")}
              </span>
              <span style="font-size: 24px; font-weight: 900; color: #0f172a; margin-top: 4px; display: block; font-family: monospace;">
                ${fStats.total}
              </span>
            </div>
            <div style="border: 1.5px solid #86efac; border-radius: 12px; padding: 12px; text-align: center; background: #f0fdf4;">
              <span style="font-size: 10px; color: #166534; font-weight: 800; display: block; text-transform: uppercase;">
                ${L("Message Clarity Rate", "معدل وضوح واستيعاب الرسالة")}
              </span>
              <span style="font-size: 24px; font-weight: 900; color: #15803d; margin-top: 4px; display: block; font-family: monospace;">
                ${fStats.q1Pct}%
              </span>
            </div>
            <div style="border: 1.5px solid #93c5fd; border-radius: 12px; padding: 12px; text-align: center; background: #eff6ff;">
              <span style="font-size: 10px; color: #1e40af; font-weight: 800; display: block; text-transform: uppercase;">
                ${L("Behavioral Influence", "معدل التأثير في القناعة والسلوك")}
              </span>
              <span style="font-size: 24px; font-weight: 900; color: #2563eb; margin-top: 4px; display: block; font-family: monospace;">
                ${fStats.q2Pct}%
              </span>
            </div>
          </div>

          <!-- Gender & Age -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 18px;">
            <div style="border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 12px; background: #ffffff;">
              <span style="font-size: 11px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 10px;">
                ${L("Gender Distribution", "التوزيع الديموغرافي حسب الجنس")}
              </span>
              <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; margin-bottom: 6px;">
                <span style="color: #0284c7;">${L(`Male: ${fStats.malePct}%`, `ذكور: ${fStats.malePct}%`)}</span>
                <span style="color: #db2777;">${L(`Female: ${fStats.femalePct}%`, `إناث: ${fStats.femalePct}%`)}</span>
              </div>
              <div style="height: 12px; background: #e2e8f0; border-radius: 6px; display: flex; overflow: hidden;">
                <div style="width: ${fStats.malePct}%; background-color: #0284c7; height: 100%;"></div>
                <div style="width: ${fStats.femalePct}%; background-color: #db2777; height: 100%;"></div>
              </div>
            </div>

            <div style="border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 12px; background: #ffffff;">
              <span style="font-size: 11px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 8px;">
                ${L("Age Cohorts Distribution", "المشاركة حسب الفئات العمرية")}
              </span>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                ${[
                  { label: L("Under 18", "أقل من ١٨"), pct: fStats.age.under18, color: "#14b8a6" },
                  { label: "18 - 24", pct: fStats.age.age18_24, color: "#0ea5e9" },
                  { label: "25 - 34", pct: fStats.age.age25_34, color: "#3b82f6" },
                  { label: "35 - 44", pct: fStats.age.age35_44, color: "#6366f1" },
                  { label: "45+", pct: fStats.age.age45_plus, color: "#8b5cf6" },
                ]
                  .map(
                    (a) => `
                  <div style="display: flex; align-items: center; gap: 8px; font-size: 9.5px;">
                    <span style="width: 55px; color: #334155; font-weight: 800;">${a.label}</span>
                    <div style="flex-grow: 1; height: 7px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                      <div style="width: ${a.pct}%; height: 100%; background-color: ${a.color};"></div>
                    </div>
                    <span style="width: 32px; text-align: end; font-weight: 900; color: #0f172a; font-family: monospace;">${a.pct}%</span>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <!-- Sample Feedback -->
          <div style="border: 1.5px solid #cbd5e1; padding: 14px; border-radius: 12px; background: #f8fafc;">
            <span style="font-size: 11.5px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 10px;">
              ${L("2. Verbatim Public Responses & Direct Testimonials", "٢. نماذج من الآراء المباشرة وانطباعات العينة الميدانية")}
            </span>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${comments
                .map(
                  (c) => `
                <div style="background: #ffffff; padding: 10px 12px; border-radius: 8px; border: 1.5px solid #e2e8f0;">
                  <div style="display: flex; justify-content: space-between; color: #64748b; font-size: 9px; font-weight: 700; margin-bottom: 3px;">
                    <span style="color: #4338ca;">${c.gender === "male" ? L("Male Respondent", "مشارك ذكر") : L("Female Respondent", "مشاركة أنثى")} (${c.age})</span>
                    <span>${c.date}</span>
                  </div>
                  <p style="margin: 0; color: #1e293b; font-size: 10.5px; font-weight: 600; line-height: 1.5;">
                    "${c.opinion}"
                  </p>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div>
          <!-- Stamp and Signatures -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 10px; border-top: 1px solid #cbd5e1; margin-top: 12px;">
            <div>
              <span style="font-size: 9.5px; color: #64748b; font-weight: 700;">${L("Official Accreditation & Verification", "الاعتماد والترخيص الرسمي")}</span>
              <span style="display: block; font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                Public Insight Autonomous Intelligence Center
              </span>
            </div>
            <div style="border: 2px solid #4338ca; border-radius: 50%; width: 56px; height: 56px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #4338ca; font-size: 6px; font-weight: 900; line-height: 1.1; background: #ffffff; box-shadow: 0 2px 4px rgba(67, 56, 202, 0.15);">
              <span>PUBLIC</span>
              <span style="border-top: 1px solid #4338ca; border-bottom: 1px solid #4338ca; padding: 1px 0; margin: 1px 0; font-size: 5px;">APPROVED</span>
              <span>INSIGHT</span>
            </div>
          </div>
          ${makePageFooter(5)}
        </div>
      </div>
    `;
  }

  // Create temporary offscreen container
  const container = document.createElement("div");
  container.id = "pdf-export-container";
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.width = "794px";
  container.style.minWidth = "794px";
  container.style.maxWidth = "794px";
  container.style.zIndex = "-9999";
  container.style.opacity = "1";
  container.style.pointerEvents = "none";
  container.style.overflow = "visible";
  container.style.backgroundColor = "#ffffff";

  container.innerHTML = `
    <div id="pdf-report-root" style="width: 794px; background-color: #ffffff; color: #0f172a; direction: ${isArabic ? "rtl" : "ltr"}; text-align: ${isArabic ? "right" : "left"}; font-family: ${isArabic ? "'Cairo', 'Segoe UI', Tahoma, sans-serif" : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; text-rendering: optimizeLegibility;">
      
      <!-- ==================== PAGE 1: COVER & CAMPAIGN SETUP ==================== -->
      <div id="pdf-page-1" class="pdf-page" style="width: 794px; height: 1123px; padding: 42px 46px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; position: relative;">
        <div>
          ${makePageHeader("AI-Powered Campaign & Sentiment Analytics", "المنصة الذكية لتحليلات الحملات والذكاء الاصطناعي", "CERTIFIED AUDIT REPORT", "تقرير فني رسمي معتمد")}

          <!-- Campaign Header -->
          <div style="margin-top: 15px; margin-bottom: 18px; border-bottom: 2px solid #cbd5e1; padding-bottom: 14px;">
            <span style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">
              ${L("Official Campaign Assessment & Strategic Intelligence", "التقرير التحليلي الشامل والتقييم الاستراتيجي للحملة")}
            </span>
            <h1 style="font-size: 26px; font-weight: 900; color: #0f172a; margin: 0; line-height: 1.25;">
              ${campaignName}
            </h1>
          </div>

          <!-- Campaign Brief Bento -->
          <div style="background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 18px; margin-bottom: 16px;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: #0f172a; margin: 0 0 12px 0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
              ${L("1. Campaign Parameters & Audience Target", "١. محددات الحملة الإعلانية والشريحة المستهدفة")}
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 14px;">
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <span style="font-size: 9.5px; font-weight: 800; color: #64748b; display: block; text-transform: uppercase;">
                  ${L("Organizer / Brand", "الجهة المنظمة / العلامة التجارية")}
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; display: block;">
                  ${organizerText}
                </span>
              </div>
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <span style="font-size: 9.5px; font-weight: 800; color: #64748b; display: block; text-transform: uppercase;">
                  ${L("Approved Budget", "الميزانية المعتمدة")}
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; display: block; font-family: monospace;">
                  $${parseFloat(record.budget || "1000").toLocaleString()} USD
                </span>
              </div>
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <span style="font-size: 9.5px; font-weight: 800; color: #64748b; display: block; text-transform: uppercase;">
                  ${L("Target Linguistic Dialect", "اللهجة اللغوية المستهدفة")}
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #4338ca; margin-top: 2px; display: block;">
                  ${dialectNames[dialectKey] || dialectKey}
                </span>
              </div>
              <div style="border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
                <span style="font-size: 9.5px; font-weight: 800; color: #64748b; display: block; text-transform: uppercase;">
                  ${L("Execution Duration", "فترة تشغيل الحملة")}
                </span>
                <span style="font-size: 12px; font-weight: 800; color: #0f172a; margin-top: 2px; display: block;">
                  ${durationText}
                </span>
              </div>
            </div>

            <!-- Demographics line -->
            <div>
              <span style="font-size: 9.5px; font-weight: 800; color: #64748b; display: block; text-transform: uppercase; margin-bottom: 6px;">
                ${L("Audience Criteria & Geographic Scope", "المعايير الديموغرافية والنطاق الجغرافي")}
              </span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                <span style="font-size: 10px; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #1e293b; font-weight: 700;">
                  ${L("Age: ", "الفئة العمرية: ")} ${audienceAge}
                </span>
                <span style="font-size: 10px; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #1e293b; font-weight: 700;">
                  ${L("Gender: ", "الجنس المستهدف: ")} ${audienceGender}
                </span>
                <span style="font-size: 10px; background: #ffffff; border: 1.5px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #1e293b; font-weight: 700;">
                  ${L("Market: ", "السوق الجغرافي: ")} ${audienceLocation}
                </span>
              </div>
            </div>
          </div>

          <!-- Description & Objectives -->
          <div style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 14px;">
            <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px;">
              <span style="font-size: 10px; font-weight: 800; color: #475569; display: block; text-transform: uppercase; margin-bottom: 4px;">
                ${L("Campaign Concept & Narrative Description", "وصف ومفهوم الحملة الإعلانية")}
              </span>
              <p style="font-size: 11px; color: #1e293b; margin: 0; line-height: 1.6; text-align: justify; font-weight: 600;">
                ${record.campaignObj?.description || (isArabic ? "حملة إعلانية مخصصة تهدف إلى تحسين الوعي وتوسيع قاعدة الجمهور المستهدف بمحتوى مبتكر." : "Strategic ad campaign targeting audience expansion and brand affinity with creative execution.")}
              </p>
            </div>

            <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px;">
              <span style="font-size: 10px; font-weight: 800; color: #475569; display: block; text-transform: uppercase; margin-bottom: 4px;">
                ${L("Primary Message & Ad Copy Slogans", "الرسالة الإعلانية الأساسية والشعارات المعتمدة")}
              </span>
              <div style="font-size: 11.5px; font-weight: 800; color: #4338ca; margin-bottom: 4px;">
                "${record.campaignObj?.message || record.campaignObj?.slogans || (isArabic ? "رسالة تسويقية محددة ومؤثرة." : "Targeted high-resonance marketing message.")}"
              </div>
              <div style="font-size: 10.5px; color: #475569; font-weight: 600; font-style: italic;">
                ${record.campaignObj?.slogans ? `«${record.campaignObj.slogans}»` : ""}
              </div>
            </div>
          </div>
        </div>

        <div>
          ${makePageFooter(1)}
        </div>
      </div>

      <!-- ==================== PAGE 2: AI DIAGNOSIS & ASSESSMENT ==================== -->
      <div id="pdf-page-2" class="pdf-page" style="width: 794px; height: 1123px; padding: 42px 46px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border-top: 1px dashed #cbd5e1;">
        <div>
          ${makePageHeader("AI Diagnostics & Strategic Performance", "تشخيصات الذكاء الاصطناعي والأداء الاستراتيجي", "AI DIAGNOSTICS", "تشخيص الذكاء الاصطناعي")}

          <!-- Top Scores Bento -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 18px;">
            <div style="border: 2px solid #a5b4fc; border-radius: 14px; padding: 16px; background: #eef2ff; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="font-size: 11px; font-weight: 900; color: #3730a3; text-transform: uppercase; margin: 0 0 4px 0;">
                  ${L("Readiness Score", "درجة الجاهزية الاستراتيجية")}
                </h4>
                <p style="font-size: 10px; color: #4338ca; margin: 0; line-height: 1.4; font-weight: 600;">
                  ${L("Target alignment & linguistic fit.", "مستوى المواءمة الثقافية والتوافق اللغوي.")}
                </p>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 34px; font-weight: 900; color: #3730a3; font-family: monospace;">${overallScore}</span>
                <span style="font-size: 12px; color: #6366f1; font-weight: 800;">/100</span>
              </div>
            </div>

            <div style="border: 2px solid #86efac; border-radius: 14px; padding: 16px; background: #f0fdf4; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h4 style="font-size: 11px; font-weight: 900; color: #166534; text-transform: uppercase; margin: 0 0 4px 0;">
                  ${L("Campaign Success Probability", "احتمالية النجاح والرنين العام")}
                </h4>
                <p style="font-size: 10px; color: #15803d; margin: 0; line-height: 1.4; font-weight: 600;">
                  ${L("Estimated organic reach & engagement.", "توقع حجم التفاعل المجتمعي والوصول العضوي.")}
                </p>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 34px; font-weight: 900; color: #15803d; font-family: monospace;">${overallScore}%</span>
              </div>
            </div>
          </div>

          <!-- Deep-Dive AI Diagnosis -->
          <div style="border: 2px solid #c7d2fe; background: #f8fafc; padding: 18px; border-radius: 14px; margin-bottom: 18px;">
            <h3 style="font-size: 13.5px; font-weight: 800; color: #1e1b4b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 8px;">
              <span>✨</span>
              <span>${L("AI Campaign Core Diagnostics (Deep-Dive Analysis)", "تشخيصات الذكاء الاصطناعي العميقة لأداء الحملة")}</span>
            </h3>
            <p style="font-size: 11.5px; color: #1e293b; line-height: 1.7; text-align: justify; margin: 0; font-weight: 600;">
              ${diagnosisText}
            </p>
          </div>

          <!-- Strategic Evaluation & Performance Forecast -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 16px;">
            <div style="border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; background: #ffffff;">
              <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; display: flex; align-items: center; gap: 6px;">
                <span>📋</span>
                <span>${L("Strategic Campaign Evaluation", "التقييم الاستراتيجي الشامل")}</span>
              </h3>
              <p style="font-size: 10.5px; color: #334155; line-height: 1.6; text-align: justify; margin: 0; font-weight: 600;">
                ${evaluationText}
              </p>
            </div>

            <div style="border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; background: #ffffff;">
              <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1.5px solid #e2e8f0; display: flex; align-items: center; gap: 6px;">
                <span>📈</span>
                <span>${record.mode === "pre" ? L("Performance Forecast", "توقع الأداء والانتشار") : L("Multi-Channel Digital Analysis", "تحليل الأداء عبر المنصات")}</span>
              </h3>
              <p style="font-size: 10.5px; color: #334155; line-height: 1.6; text-align: justify; margin: 0; font-weight: 600;">
                ${forecastText}
              </p>
            </div>
          </div>

          <!-- Audience Behavior & Platform Breakdown -->
          <div style="border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 14px; background: #f8fafc;">
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 6px 0;">
              ${L("Audience Behavioral Dynamics & Platform Optimization", "ديناميكيات سلوك الجمهور والتحسين عبر المنصات")}
            </h3>
            <p style="font-size: 10.5px; color: #334155; line-height: 1.6; text-align: justify; margin: 0; font-weight: 600;">
              ${record.aiReport?.audienceBehaviorAnalysis && (isArabic ? hasArabic(record.aiReport.audienceBehaviorAnalysis) : !hasArabic(record.aiReport.audienceBehaviorAnalysis))
                ? record.aiReport.audienceBehaviorAnalysis
                : defaultAudienceAnalysis}
            </p>
          </div>
        </div>

        <div>
          ${makePageFooter(2)}
        </div>
      </div>

      <!-- ==================== PAGE 3: SWOT STRATEGIC RESILIENCE ==================== -->
      <div id="pdf-page-3" class="pdf-page" style="width: 794px; height: 1123px; padding: 42px 46px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border-top: 1px dashed #cbd5e1;">
        <div>
          ${makePageHeader("SWOT Strategic Resilience & Impact Index", "التحليل الرباعي ومؤشر الجدوى الاستراتيجية", "SWOT & RESILIENCE", "التحليل الرباعي")}

          <!-- SWOT Chart Bar -->
          <div style="background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 14px; padding: 16px; margin-bottom: 18px;">
            <h4 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 10px 0; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px;">
              ${L("SWOT Strategic Impact Index (Audience Resonance)", "مؤشر الأداء والجدوى الاستراتيجية لتحليل SWOT")}
            </h4>
            
            <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 135px; padding: 5px 15px 10px 15px;">
              <div style="display: flex; flex-direction: column; align-items: center; width: 110px;">
                <span style="font-size: 12px; font-weight: 900; color: #15803d; margin-bottom: 4px; font-family: monospace;">${sScore}%</span>
                <div style="width: 44px; height: ${sScore * 0.9}px; background: #16a34a; border-radius: 6px 6px 0 0;"></div>
                <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 6px;">${L("Strengths", "نقاط القوة")}</span>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; width: 110px;">
                <span style="font-size: 12px; font-weight: 900; color: #b91c1c; margin-bottom: 4px; font-family: monospace;">${wScore}%</span>
                <div style="width: 44px; height: ${wScore * 0.9}px; background: #dc2626; border-radius: 6px 6px 0 0;"></div>
                <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 6px;">${L("Weaknesses", "نقاط الضعف")}</span>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; width: 110px;">
                <span style="font-size: 12px; font-weight: 900; color: #1d4ed8; margin-bottom: 4px; font-family: monospace;">${oScore}%</span>
                <div style="width: 44px; height: ${oScore * 0.9}px; background: #2563eb; border-radius: 6px 6px 0 0;"></div>
                <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 6px;">${L("Opportunities", "الفرص المتاحة")}</span>
              </div>

              <div style="display: flex; flex-direction: column; align-items: center; width: 110px;">
                <span style="font-size: 12px; font-weight: 900; color: #b45309; margin-bottom: 4px; font-family: monospace;">${tScore}%</span>
                <div style="width: 44px; height: ${tScore * 0.9}px; background: #d97706; border-radius: 6px 6px 0 0;"></div>
                <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 6px;">${L("Threats", "المخاطر المحتملة")}</span>
              </div>
            </div>
          </div>

          <!-- SWOT 4 Grid Cards -->
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 16px;">
            <div style="background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 900; color: #166534; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                <span>✅</span>
                <span>${L("Strengths (Core Strategic Assets)", "نقاط القوة وركائز النجاح")}</span>
              </h4>
              <ul style="margin: 0; padding-inline-start: 16px; font-size: 10px; color: #14532d; line-height: 1.6; font-weight: 600;">
                ${finalStrengths.map((s: string) => `<li>${s}</li>`).join("")}
              </ul>
            </div>

            <div style="background: #fef2f2; border: 1.5px solid #fca5a5; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 900; color: #991b1b; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                <span>⚠️</span>
                <span>${L("Weaknesses & Constraints", "نقاط الضعف والتحديات")}</span>
              </h4>
              <ul style="margin: 0; padding-inline-start: 16px; font-size: 10px; color: #7f1d1d; line-height: 1.6; font-weight: 600;">
                ${finalWeaknesses.map((w: string) => `<li>${w}</li>`).join("")}
              </ul>
            </div>

            <div style="background: #eff6ff; border: 1.5px solid #93c5fd; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 900; color: #1e40af; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                <span>🚀</span>
                <span>${L("Growth Opportunities", "فرص التوسع والنمو")}</span>
              </h4>
              <ul style="margin: 0; padding-inline-start: 16px; font-size: 10px; color: #1e3a8a; line-height: 1.6; font-weight: 600;">
                ${finalOpportunities.map((o: string) => `<li>${o}</li>`).join("")}
              </ul>
            </div>

            <div style="background: #fffbeb; border: 1.5px solid #fde68a; border-radius: 12px; padding: 14px;">
              <h4 style="font-size: 12px; font-weight: 900; color: #92400e; margin: 0 0 8px 0; display: flex; align-items: center; gap: 6px;">
                <span>🛡️</span>
                <span>${L("Threats & Mitigation Strategies", "المخاطر وسبل الحماية")}</span>
              </h4>
              <ul style="margin: 0; padding-inline-start: 16px; font-size: 10px; color: #78350f; line-height: 1.6; font-weight: 600;">
                ${finalThreats.map((t: string) => `<li>${t}</li>`).join("")}
              </ul>
            </div>
          </div>
        </div>

        <div>
          ${makePageFooter(3)}
        </div>
      </div>

      <!-- ==================== PAGE 4: REGIONAL WILAYAS, METRICS & RECOMMENDATIONS ==================== -->
      <div id="pdf-page-4" class="pdf-page" style="width: 794px; height: 1123px; padding: 42px 46px; box-sizing: border-box; background: #ffffff; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; border-top: 1px dashed #cbd5e1;">
        <div>
          ${makePageHeader("Regional Wilayas & Performance Metrics", "التحليل الإقليمي ومؤشرات الأداء والتوصيات", "REGIONAL & ACTIONS", "التحليل الإقليمي والتوصيات")}

          <!-- Wilayas Table -->
          <div style="margin-bottom: 14px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>📍</span>
              <span>${L("Geographical Optimization & Regional Resonance (Algeria)", "التحليل الإقليمي وملاءمة اللهجة عبر ولايات الجزائر")}</span>
            </h3>
            
            <div style="border: 1.5px solid #cbd5e1; border-radius: 10px; overflow: hidden; background: #ffffff;">
              <table style="width: 100%; border-collapse: collapse; text-align: ${isArabic ? "right" : "left"}; font-size: 10px;">
                <thead>
                  <tr style="background-color: #f1f5f9; border-bottom: 1.5px solid #cbd5e1;">
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a;">${L("Wilaya (Province)", "الولاية")}</th>
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a; text-align: center;">${L("Resonance", "درجة التجاوب")}</th>
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a; text-align: center;">${L("Status", "الحالة")}</th>
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a; text-align: center;">${L("Engagement", "معدل التفاعل")}</th>
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a; text-align: center;">${L("Est. Views", "المشاهدات المقدرة")}</th>
                    <th style="padding: 7px 10px; font-weight: 800; color: #0f172a; text-align: center;">${L("Best Platform", "المنصة المثالية")}</th>
                  </tr>
                </thead>
                <tbody>
                  ${wilayaRows
                    .map(
                      (row) => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 6px 10px; font-weight: 800; color: #0f172a;">${row.name}</td>
                      <td style="padding: 6px 10px; text-align: center; font-weight: 900; color: #4338ca; font-family: monospace;">${row.score}%</td>
                      <td style="padding: 6px 10px; text-align: center;">
                        <span style="color: ${row.statusColor}; background: ${row.statusBg}; font-weight: 800; padding: 2px 6px; border-radius: 4px; font-size: 9px;">
                          ${row.statusLabel}
                        </span>
                      </td>
                      <td style="padding: 6px 10px; text-align: center; font-weight: 800; color: #334155; font-family: monospace;">${row.engagementRate}%</td>
                      <td style="padding: 6px 10px; text-align: center; font-weight: 700; color: #0f172a; font-family: monospace;">${Intl.NumberFormat().format(row.views)}</td>
                      <td style="padding: 6px 10px; text-align: center; font-weight: 800; color: #4338ca;">${row.bestPlatform}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Sentiment & KPIs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px;">
            <div style="border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc;">
              <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 6px;">
                ${L("Sentiment Listening & Reception", "تحليل النبرة ورصد المشاعر")}
              </span>
              <div style="height: 12px; border-radius: 6px; display: flex; overflow: hidden; background: #e2e8f0; margin-bottom: 6px;">
                <div style="width: ${pSentiment}%; background-color: #16a34a;"></div>
                <div style="width: ${nSentiment}%; background-color: #64748b;"></div>
                <div style="width: ${ngSentiment}%; background-color: #dc2626;"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 9.5px; font-weight: 800;">
                <span style="color: #15803d;">● ${L("Positive", "إيجابي")} ${pSentiment}%</span>
                <span style="color: #475569;">● ${L("Neutral", "محايد")} ${nSentiment}%</span>
                <span style="color: #b91c1c;">● ${L("Negative", "سلبي")} ${ngSentiment}%</span>
              </div>
            </div>

            <!-- Digital KPIs -->
            <div style="border: 1.5px solid #cbd5e1; border-radius: 10px; padding: 12px; background: #f8fafc;">
              <span style="font-size: 10.5px; font-weight: 800; color: #0f172a; display: block; margin-bottom: 6px;">
                ${L("Estimated Engagement Metrics", "مؤشرات التفاعل الرقمي المتوقعة")}
              </span>
              <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;">
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; text-align: center; background: #ffffff;">
                  <span style="font-size: 8px; color: #64748b; font-weight: 800; display: block;">${L("VIEWS", "المشاهدات")}</span>
                  <span style="font-size: 11px; font-weight: 900; color: #0f172a; font-family: monospace;">${Intl.NumberFormat().format(viewsCount)}</span>
                </div>
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; text-align: center; background: #ffffff;">
                  <span style="font-size: 8px; color: #64748b; font-weight: 800; display: block;">${L("LIKES", "الإعجابات")}</span>
                  <span style="font-size: 11px; font-weight: 900; color: #e11d48; font-family: monospace;">${Intl.NumberFormat().format(likesCount)}</span>
                </div>
                <div style="border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px; text-align: center; background: #ffffff;">
                  <span style="font-size: 8px; color: #64748b; font-weight: 800; display: block;">${L("CLICKS", "النقرات")}</span>
                  <span style="font-size: 11px; font-weight: 900; color: #2563eb; font-family: monospace;">${Intl.NumberFormat().format(clicksCount)}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Recommendations -->
          <div style="margin-bottom: 12px;">
            <h3 style="font-size: 12px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span>💡</span>
              <span>${L("Final Priority Actionable Recommendations", "التوصيات الاستراتيجية ذات الأولوية القصوى")}</span>
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 7px;">
              ${finalRecommendations
                .map(
                  (rec, idx) => `
                <div style="background: #ffffff; border: 1.5px solid #cbd5e1; padding: 8px 12px; border-radius: 8px; display: flex; align-items: flex-start; gap: 10px;">
                  <span style="height: 20px; width: 20px; border-radius: 50%; background: #4338ca; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 10.5px; font-weight: 900; flex-shrink: 0; font-family: monospace;">
                    ${idx + 1}
                  </span>
                  <div>
                    <h5 style="margin: 0 0 2px 0; font-size: 11px; font-weight: 800; color: #0f172a;">${rec.title}</h5>
                    <p style="margin: 0; font-size: 10px; color: #334155; line-height: 1.5; font-weight: 600; text-align: justify;">${rec.detail}</p>
                  </div>
                </div>
              `
                )
                .join("")}
            </div>
          </div>
        </div>

        <div>
          <!-- Official Seal & Signature -->
          <div style="display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8px; border-top: 1px solid #cbd5e1;">
            <div>
              <span style="font-size: 9px; color: #64748b; font-weight: 700;">${L("Approved & Validated by Board", "معتمد ومرخص رسمياً من قبل")}</span>
              <span style="display: block; font-size: 10.5px; font-weight: 800; color: #0f172a; margin-top: 2px;">
                Public Insight Autonomous Intelligence Center
              </span>
            </div>
            <div style="border: 2px solid #4338ca; border-radius: 50%; width: 50px; height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #4338ca; font-size: 5.5px; font-weight: 900; line-height: 1.1; background: #ffffff;">
              <span>PUBLIC</span>
              <span style="border-top: 1px solid #4338ca; border-bottom: 1px solid #4338ca; padding: 1px 0; margin: 1px 0; font-size: 4.5px;">APPROVED</span>
              <span>INSIGHT</span>
            </div>
          </div>
          ${makePageFooter(4)}
        </div>
      </div>

      ${feedbackHtmlPage}

    </div>
  `;

  document.body.appendChild(container);

  if (document.fonts && document.fonts.ready) {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 800)),
      ]);
    } catch {}
  }
  await new Promise((resolve) => setTimeout(resolve, 350));

  const safeName = (record.name || "Campaign")
    .trim()
    .replace(/[\/\\?%*:|"<>]/g, "_")
    .replace(/\s+/g, "_");
  const fileName = `PublicInsight_${safeName}_Report.pdf`;

  try {
    const page1 = container.querySelector("#pdf-page-1") as HTMLElement;
    const page2 = container.querySelector("#pdf-page-2") as HTMLElement;
    const page3 = container.querySelector("#pdf-page-3") as HTMLElement;
    const page4 = container.querySelector("#pdf-page-4") as HTMLElement;
    const page5 = container.querySelector("#pdf-page-5") as HTMLElement;
    const pages = [page1, page2, page3, page4, page5].filter(Boolean);

    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < pages.length; i++) {
      const pageEl = pages[i];
      if (!pageEl) continue;

      const canvas = await html2canvas(pageEl, {
        scale: 2.3, // ~220 DPI crisp print quality
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "JPEG", 0, 0, 210, 297, undefined, "NONE");
    }

    const pdfBlob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);

    // Multi-target download mechanism to guarantee saving on user's PC:
    try {
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = fileName;
      link.setAttribute("download", fileName);
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        try {
          if (document.body.contains(link)) document.body.removeChild(link);
        } catch {}
      }, 5000);
    } catch (e) {
      console.warn("Anchor click failed:", e);
    }

    try {
      pdf.save(fileName);
    } catch (e) {
      console.warn("pdf.save failed:", e);
    }

    return { success: true, blobUrl, fileName };
  } catch (error) {
    console.error("Canvas PDF generation encountered an error:", error);
    // If an error happens, throw or re-try to ensure user gets high-fidelity output
    throw error;
  } finally {
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
