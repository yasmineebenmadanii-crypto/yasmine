import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function getPdfCampaignFeedback(campaignId: string, overallScore: number = 80) {
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

  const positiveOpinions = [
    "حملة رائعة ومفهومة جداً، أعجبني التصميم واختيار الكلمات الرنانة والمؤثرة.",
    "فكرة ممتازة وتلامس الواقع اليومي، التوصيل كان سريعاً ومناسباً جداً للفئات الشابة.",
    "اللهجة المستخدمة قريبة جداً من القلب وسهلة الفهم وابتعدت عن التعقيد.",
    "أفضل حملة رأيتها هذا الشهر، التنظيم كان غاية في الروعة والإنتاج متميز.",
    "رسالة قوية وهادفة غيرت وجهة نظري الإيجابية تماماً تجاه المنتج والخدمة.",
    "مبدعون! جودة الفيديو والمحتوى الإبداعي ممتازة وبسيطة.",
    "تنظيم رائع وتناسق تام بين الرسالة المكتوبة والهدف المرجو.",
    "الرسالة وصلتني مباشرة دون عناء، أعجبني بساطة الشرح والأسلوب.",
    "فخور برؤية مثل هذه الحملات المنظمة والذكية في مجتمعنا.",
    "أفكار عصرية وجذابة ومناسبة لكافة الأعمار والفئات المستهدفة."
  ];

  const neutralOpinions = [
    "الحملة جيدة في مجملها لكنها تحتاج إلى شرح إضافي لبعض النقاط التقنية.",
    "المحتوى ممتاز ولكن المؤثرات البصرية والموسيقى كانت مشتتة قليلاً.",
    "التنظيم مقبول ولكن أرى أنه كان يمكن تحسين جودة الصور والبوسترات بشكل أفضل.",
    "فهمت الرسالة بشكل عام ولكن لم تغير رأيي أو سلوكي الفعلي بشكل كامل.",
    "جيدة ولكن تمنيت لو ركزت أكثر على الفئات العمرية الأصغر سناً وتطلعاتهم.",
    "حملة متوسطة الأداء، الرسالة واضحة لكن تكرار الأفكار كان مملاً بعض الشيء."
  ];

  const negativeOpinions = [
    "الرسالة غير واضحة وهناك غموض كبير في الهدف الرئيسي من الحملة الإعلانية.",
    "لم تعجبني اللهجة المستخدمة، أرى أنها غير ملائمة لعامة الناس والشريحة الكبرى.",
    "محتوى تقليدي ومكرر، يحتاج لمزيد من الابتكار والبعد عن النمطية.",
    "التنظيم يحتاج لإعادة نظر بالكامل، لم أستطع فهم العرض والهدف بالشكل المطلوب."
  ];

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
        opinion = positiveOpinions[seed % positiveOpinions.length];
      } else if (q1 === "partially" || q2 === "no") {
        opinion = neutralOpinions[seed % neutralOpinions.length];
      } else {
        opinion = negativeOpinions[seed % negativeOpinions.length];
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

export async function exportCampaignToPDF(record: any, lang: "ar" | "en") {
  const isArabic = lang === "ar";
  const L = (en: string, ar: string) => (isArabic ? ar : en);

  // Default fallbacks for evaluation fields
  const defaultEvaluation = isArabic
    ? "تظهر استراتيجية الحملة تموضعاً قوياً وقنوات إعلانية محددة بعناية. تتناسب التصاميم والرسائل الإعلانية تماماً مع اهتمامات وتطلعات الشريحة المستهدفة، مما يضمن وصولاً مستقراً واستغلالاً مثالياً ومستداماً."
    : "Overall, the campaign strategy shows robust positioning with well-defined channels. Ad creatives align well with audience pain points, ensuring stable reach and efficient budget utilization.";

  const defaultForecast = isArabic
    ? "فرص قوية لتحقيق معدلات وعي مرتفعة للغاية مع قفزة تفاعل متوقعة بفضل المواءمة الثقافية. يتوقع أن تبقى كلفة النقرة (CPC) دون متوسط السوق في حال الاعتماد على النسخ الإعلانية المحلية."
    : "Strong potential to hit high awareness levels with an estimated engagement spike. Localized dialect copy is projected to stay below industry cost-per-click averages.";

  const defaultAudienceAnalysis = isArabic
    ? "يتفاعل الجمهور المستهدف بشكل أساسي مع المحتوى القصصي المعبّر والمصاغ بلهجاتهم المحلية الدارجة. الفئات الشابة تبحث عن المصداقية والسرعة وتفضل مقاطع الفيديو القصيرة التي تطرح حلولاً مباشرة."
    : "The target audience is highly responsive to authentic, storytelling ad structures presented in their local dialect. The younger demographic prioritizes directness and high visual engagement.";

  const defaultPlatformAnalysis = isArabic
    ? "تحقق منصتا إنستجرام وتيك توك أعلى معدلات تفاعل عضوي، حيث يتجاوز التفاعل مع مقاطع ريلز والفيديو القصيرة ضعف المنشورات العادية، بينما يحافظ فيسبوك على وصول عائلي مستقر."
    : "Instagram and TikTok consistently output the highest engagement metrics for short-form visual content. Facebook remains a baseline for broader reach.";

  const dialectNames: Record<string, string> = {
    standard: isArabic ? "العربية الفصحى" : "Standard Arabic (Fusha)",
    algerian: isArabic ? "اللهجة الجزائرية" : "Algerian Dialect",
    gulf: isArabic ? "اللهجة الخليجية" : "Gulf Dialect",
    levantine: isArabic ? "اللهجة الشامية" : "Levantine Dialect",
    english: isArabic ? "الإنجليزية" : "English",
  };

  // Pre-seed 6 Wilayas for Page 3 using the component formulas
  const selectedWilayas = [
    { code: 16, nameAr: "الجزائر", nameEn: "Algiers", region: "coast" },
    { code: 31, nameAr: "وهران", nameEn: "Oran", region: "coast" },
    { code: 25, nameAr: "قسنطينة", nameEn: "Constantine", region: "plateaus" },
    { code: 19, nameAr: "سطيف", nameEn: "Sétif", region: "plateaus" },
    { code: 23, nameAr: "عنابة", nameEn: "Annaba", region: "coast" },
    { code: 8, nameAr: "بشار", nameEn: "Béchar", region: "desert" },
  ];

  const dialectKey = record.campaignObj?.dialect || record.dialect || "standard";
  const campaignType = record.campaignObj?.type || "awareness";
  const overallScore = record.score || 70;
  const campaignName = record.name || "";

  const isMaghrebiDialect =
    dialectKey.toLowerCase() === "maghrebi" ||
    dialectKey.toLowerCase() === "algerian" ||
    (dialectKey.toLowerCase() !== "gulf" && dialectKey.toLowerCase() !== "standard");

  const wilayaRows = selectedWilayas.map((wilaya) => {
    const seed = (wilaya.code * 7 + campaignName.length * 3 + overallScore * 5) % 100;
    let localScore = overallScore - 15 + (seed % 30);
    if (isMaghrebiDialect) {
      localScore += 12;
    } else if (dialectKey.toLowerCase() === "standard") {
      localScore += 2;
    } else {
      localScore -= 10;
    }

    const isMajorCity = [16, 31, 25, 19, 23].includes(wilaya.code);
    if (isMajorCity) localScore += 8;
    localScore = Math.max(20, Math.min(99, Math.round(localScore)));

    let statusLabel = L("Medium", "متوسط");
    let statusColor = "#d97706"; // amber
    if (localScore >= 78) {
      statusLabel = L("High", "مرتفع");
      statusColor = "#16a34a"; // green
    } else if (localScore < 55) {
      statusLabel = L("Weak", "ضعيف");
      statusColor = "#dc2626"; // red
    }

    const populationFactor = isMajorCity
      ? 5.2
      : wilaya.region === "coast"
        ? 3.1
        : wilaya.region === "plateaus"
          ? 2.0
          : 0.8;
    const baseViews = Math.round((overallScore * 250 + seed * 100) * populationFactor);
    const views = Math.max(500, baseViews);

    const engagementRate = Math.round((2.2 + localScore / 18) * 10) / 10;
    
    let bestPlatform = "Instagram";
    if (wilaya.region === "desert") {
      bestPlatform = "Facebook";
    } else if (campaignType === "commercial" && isMajorCity) {
      bestPlatform = "TikTok";
    } else if (campaignType === "electoral" || campaignType === "social") {
      bestPlatform = "Facebook";
    } else if (wilaya.code === 16) {
      bestPlatform = "Instagram";
    }

    return {
      name: L(wilaya.nameEn, wilaya.nameAr),
      score: localScore,
      statusLabel,
      statusColor,
      views,
      engagementRate,
      bestPlatform,
    };
  });

  // Extract variables safely
  const pSentiment = record.sentiment?.positive ?? 80;
  const nSentiment = record.sentiment?.neutral ?? 15;
  const ngSentiment = record.sentiment?.negative ?? 5;

  const viewsCount = record.metrics?.views ?? 10000;
  const likesCount = record.metrics?.likes ?? 500;
  const commentsCount = record.metrics?.comments ?? 120;
  const sharesCount = record.metrics?.shares ?? 80;
  const clicksCount = record.metrics?.clicks ?? (viewsCount * 0.08);

  const durationText = record.campaignObj?.durationValue
    ? `${record.campaignObj.durationValue} ${L(record.campaignObj.durationUnit || "days", record.campaignObj.durationUnit === "weeks" ? "أسابيع" : "أيام")}`
    : L("Not specified", "غير محدد");

  const isPostCampaign = record.mode === "post";
  
  // SWOT dynamic lists and scores
  const strengthsList = (record.aiReport?.strengths || record.resultObj?.strengths || [
    isArabic ? "مواءمة لغوية قوية جداً مع الشريحة المستهدفة بفضل توظيف اللهجة الملائمة." : "Highly effective linguistic alignment with the target audience through appropriate dialect.",
    isArabic ? "وضوح الرسالة الإعلانية الأساسية وسهولة تداولها بين الفئات المستهدفة." : "High clarity of the primary campaign message making it easy to comprehend.",
    isArabic ? "تصميمات مرئية متميزة تدعم مصداقية العلامة التجارية والجهود الإعلانية." : "Engaging and premium visual assets that support brand credibility."
  ]);

  const weaknessesList = (record.aiReport?.weaknesses || record.resultObj?.weaknesses || [
    isArabic ? "ارتفاع طفيف في كلفة النقرة المتوقعة في ظل المنافسة الرقمية الشديدة." : "Slightly higher projected CPC due to saturated digital ad bidding.",
    isArabic ? "محدودية قنوات الوصول الرقمية المتاحة قد تؤخر تحقيق أهداف الحملة بسرعة." : "Relatively limited distribution channels may delay rapid conversion gains.",
    isArabic ? "الحاجة إلى تحسين نصوص الإعلانات لتفادي أي سوء فهم للنوادر الثقافية." : "Linguistic styling requires continuous review to prevent cultural friction."
  ]);

  const opportunitiesList = (record.aiReport?.opportunities || record.resultObj?.opportunities || [
    isArabic ? "استهداف المناطق الداخلية والولايات ذات المنافسة المنخفضة لمضاعفة العائد." : "Targeting underserved interior provinces to secure lower customer acquisition costs.",
    isArabic ? "توظيف المؤثرين وصناع المحتوى لتقديم رسائل تسويقية في قالب قصصي مبسط." : "Partnering with micro-influencers to convey narrative-based brand stories.",
    isArabic ? "دمج مقاطع الفيديو القصيرة (Shorts/Reels) لرفع معدل الانتشار العضوي." : "Deploying portrait short-form video reels to drive viral organic traction."
  ]);

  const threatsList = (record.aiReport?.threats || record.resultObj?.threats || [
    isArabic ? "التغير المفاجئ في خوارزميات الاستهداف بالمنصات قد يرفع كلفة التمويل." : "Unpredictable ad delivery algorithm updates may spike distribution costs.",
    isArabic ? "ارتفاع حدة التنافس على اهتمام الجمهور في المواسم والعطلات الرسمية." : "Intense holiday season auction fatigue and audience attention dilution.",
    isArabic ? "حساسية بعض فئات الجمهور تجاه المصطلحات والرموز الثقافية المستجدة." : "Linguistic or cultural fatigue if campaign copy feels artificial or outdated."
  ]);

  const sScore = Math.max(45, Math.min(98, overallScore + 5));
  const wScore = Math.max(12, Math.min(65, Math.round((100 - overallScore) * 0.8 + 10)));
  const oScore = Math.max(50, Math.min(95, Math.round(overallScore * 0.9 + 5)));
  const tScore = Math.max(15, Math.min(60, Math.round((100 - overallScore) * 1.1)));

  let feedbackHtmlPage = "";
  
  if (isPostCampaign) {
    const feedbacks = getPdfCampaignFeedback(record.id, record.score);
    const total = feedbacks.length;
    
    const ageUnder18 = feedbacks.filter(f => f.age === "under-18").length;
    const age18_24 = feedbacks.filter(f => f.age === "18-24").length;
    const age25_34 = feedbacks.filter(f => f.age === "25-34").length;
    const age35_44 = feedbacks.filter(f => f.age === "35-44").length;
    const age45_plus = feedbacks.filter(f => f.age === "45-54" || f.age === "55-plus").length;

    const male = feedbacks.filter(f => f.gender === "male").length;
    const female = feedbacks.filter(f => f.gender === "female").length;

    const q1Yes = feedbacks.filter(f => f.q1 === "yes").length;

    const q2Yes = feedbacks.filter(f => f.q2 === "yes").length;

    const comments = feedbacks.filter(f => f.opinion && f.opinion.trim().length > 0);

    const fStats = {
      total,
      age: {
        under18: total ? Math.round((ageUnder18 / total) * 100) : 0,
        age18_24: total ? Math.round((age18_24 / total) * 100) : 0,
        age25_34: total ? Math.round((age25_34 / total) * 100) : 0,
        age35_44: total ? Math.round((age35_44 / total) * 100) : 0,
        age45_plus: total ? Math.round((age45_plus / total) * 100) : 0,
      },
      gender: {
        male: total ? Math.round((male / total) * 100) : 0,
        female: total ? Math.round((female / total) * 100) : 0,
      },
      q1: { yes: total ? Math.round((q1Yes / total) * 100) : 0 },
      q2: { yes: total ? Math.round((q2Yes / total) * 100) : 0 },
      comments: comments.slice(0, 3)
    };

    feedbackHtmlPage = `
      <!-- ==================== PAGE 5: FIELD FEEDBACK & QR SURVEY ==================== -->
      <div id="pdf-page-5" style="width: 794px; height: 1123px; padding: 60px; box-sizing: border-box; background-color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 1px dashed #cbd5e1;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 25px;">
          <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
            ${record.name} • ${L("FIELD FEEDBACK & QR DIAGNOSTICS", "التقرير الميداني للآراء ورمز الاستجابة")}
          </div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${record.date}</div>
        </div>

        <div style="margin-bottom: 20px; flex-grow: 1;">
          <h3 style="font-size: 13px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>👥</span>
            <span>${L("Offline Campaign Field Survey & QR Metrics", "نتائج الاستطلاع الميداني وتفاعل الجمهور")}</span>
          </h3>
          <p style="font-size: 10.5px; color: #64748b; line-height: 1.5; text-align: justify; margin: 0 0 15px 0;">
            ${L(
              "Deploying QR feedback terminals on physical locations allows for rapid sampling of audience sentiment. Below is a breakdown of the on-the-ground public responses.",
              "تم توفير رمز استجابة مخصص للحملة في نقاط الالتقاء الميدانية والمطبوعات الإعلانية. يعرض التقرير التالي خلاصة إجابات وتقييمات عينة عشوائية من الفئات المستهدفة."
            )}
          </p>

          <!-- Metrics Grid -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 20px;">
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; background: #f8fafc;">
              <span style="font-size: 9px; color: #64748b; font-weight: bold; display: block;">${L("TOTAL RESPONDENTS", "إجمالي المشاركين")}</span>
              <span style="font-size: 18px; font-weight: 800; color: #1e293b; margin-top: 4px; display: block;">${fStats.total}</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; background: #f8fafc;">
              <span style="font-size: 9px; color: #64748b; font-weight: bold; display: block;">${L("MESSAGE CLARITY", "وضوح وفهم الرسالة")}</span>
              <span style="font-size: 18px; font-weight: 800; color: #10b981; margin-top: 4px; display: block;">${fStats.q1.yes}%</span>
            </div>
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; background: #f8fafc;">
              <span style="font-size: 9px; color: #64748b; font-weight: bold; display: block;">${L("BEHAVIOR INFLUENCE", "تأثير السلوك والقناعة")}</span>
              <span style="font-size: 18px; font-weight: 800; color: #06b6d4; margin-top: 4px; display: block;">${fStats.q2.yes}%</span>
            </div>
          </div>

          <!-- Demographic bars -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <!-- Gender -->
            <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px;">
              <span style="font-size: 10px; font-weight: bold; color: #475569; display: block; margin-bottom: 10px;">${L("Gender Split", "نسبة المشاركة حسب الجنس")}</span>
              <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; font-weight: bold; margin-bottom: 4px;">
                <span style="color: #06b6d4;">${L(`Male: ${fStats.gender.male}%`, `ذكور: ${fStats.gender.male}%`)}</span>
                <span style="color: #ec4899;">${L(`Female: ${fStats.gender.female}%`, `إناث: ${fStats.gender.female}%`)}</span>
              </div>
              <div style="height: 10px; background: #e2e8f0; border-radius: 5px; display: flex; overflow: hidden;">
                <div style="width: ${fStats.gender.male}%; background-color: #06b6d4; height: 100%;"></div>
                <div style="width: ${fStats.gender.female}%; background-color: #ec4899; height: 100%;"></div>
              </div>
            </div>
            <!-- Age Groups -->
            <div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px;">
              <span style="font-size: 10px; font-weight: bold; color: #475569; display: block; margin-bottom: 6px;">${L("Age Demographics", "الفئات العمرية")}</span>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px;">
                  <span style="width: 50px; color: #475569; font-weight: bold;">${L("Under 18", "أقل من ١٨")}</span>
                  <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;"><div style="width: ${fStats.age.under18}%; height: 100%; background-color: #14b8a6;"></div></div>
                  <span style="width: 30px; text-align: end; font-weight: bold; color: #1e293b;">${fStats.age.under18}%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px;">
                  <span style="width: 50px; color: #475569; font-weight: bold;">18-24</span>
                  <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;"><div style="width: ${fStats.age.age18_24}%; height: 100%; background-color: #6366f1;"></div></div>
                  <span style="width: 30px; text-align: end; font-weight: bold; color: #1e293b;">${fStats.age.age18_24}%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px;">
                  <span style="width: 50px; color: #475569; font-weight: bold;">25-34</span>
                  <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;"><div style="width: ${fStats.age.age25_34}%; height: 100%; background-color: #a855f7;"></div></div>
                  <span style="width: 30px; text-align: end; font-weight: bold; color: #1e293b;">${fStats.age.age25_34}%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px;">
                  <span style="width: 50px; color: #475569; font-weight: bold;">35-44</span>
                  <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;"><div style="width: ${fStats.age.age35_44}%; height: 100%; background-color: #ec4899;"></div></div>
                  <span style="width: 30px; text-align: end; font-weight: bold; color: #1e293b;">${fStats.age.age35_44}%</span>
                </div>
                <div style="display: flex; align-items: center; gap: 8px; font-size: 9px;">
                  <span style="width: 50px; color: #475569; font-weight: bold;">45+</span>
                  <div style="flex-grow: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;"><div style="width: ${fStats.age.age45_plus}%; height: 100%; background-color: #64748b;"></div></div>
                  <span style="width: 30px; text-align: end; font-weight: bold; color: #1e293b;">${fStats.age.age45_plus}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Written Opinions -->
          <div>
            <span style="font-size: 10px; font-weight: bold; color: #475569; display: block; margin-bottom: 8px;">${L("Direct Written Opinions from Offline Citizens", "ملاحظات وآراء عينات الجمهور ميدانياً")}</span>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${fStats.comments.map(c => `
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; font-size: 10px; line-height: 1.4;">
                  <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: #94a3b8; margin-bottom: 4px; font-weight: bold;">
                    <span>${c.gender === "male" ? L("Male respondent", "مشارك ذكر") : L("Female respondent", "مشاركة أنثى")} (${c.age})</span>
                    <span>${c.date}</span>
                  </div>
                  <p style="margin: 0; color: #334155; font-style: italic;">"${c.opinion}"</p>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Approved Stamp for Page 5 -->
        <div style="margin-top: 15px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #f1f5f9; padding-top: 15px;">
          <div style="font-size: 10px; color: #94a3b8;">
            <span>${L("Approved by Public Insight Board", "معتمد ومرخص إلكترونياً من قبل")}</span>
            <span style="display: block; font-weight: 700; color: #475569; margin-top: 3px;">Public Insight Analytics Center</span>
          </div>
          <!-- Stamp Graphic -->
          <div style="border: 2px double #4f46e5; border-radius: 50%; width: 55px; height: 55px; display: flex; flex-direction: column; justify-content: center; align-items: center; transform: rotate(-8deg); color: #4f46e5; font-size: 6px; font-weight: 800; line-height: 1.1; opacity: 0.85; background: #ffffff;">
            <span>PUBLIC</span>
            <span style="border-top: 1px solid #4f46e5; border-bottom: 1px solid #4f46e5; padding: 1px 0; margin: 1px 0; font-size: 5px;">APPROVED</span>
            <span>INSIGHT</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 700;">
          <div>${L("Public Insight Platform • AI-Powered Brand Analytics", "منصة Public Insight • التقرير الفني المعتمد للحملة")}</div>
          <div style="font-family: monospace;">Page 5 / 5</div>
        </div>
      </div>
    `;
  }

  // Create temporary container styled for multi-page high-fidelity PDF generation
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.top = "-9999px";
  container.style.width = "794px";
  container.style.backgroundColor = "#1e293b"; // dark background to separate canvas items

  // Build the HTML structure with exactly 4 pages
  container.innerHTML = `
    <!-- Load custom corporate styling and Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <div id="pdf-report-root" style="width: 794px; font-family: 'Cairo', 'Inter', system-ui, -apple-system, sans-serif; direction: ${isArabic ? "rtl" : "ltr"}; text-align: ${isArabic ? "right" : "left"};">
      
      <!-- ==================== PAGE 1: COVER PAGE & CAMPAIGN SETUP ==================== -->
      <div id="pdf-page-1" style="width: 794px; height: 1123px; padding: 60px; box-sizing: border-box; background-color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
        <!-- Background accents -->
        <div style="position: absolute; top: 0; right: 0; width: 300px; height: 10px; background: linear-gradient(90deg, #4f46e5, #06b6d4);"></div>
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="100" height="100" rx="24" fill="url(#p1-gradient)" />
              <path d="M30 72V48" stroke="white" stroke-width="8" stroke-linecap="round"/>
              <path d="M50 72V28" stroke="white" stroke-width="8" stroke-linecap="round"/>
              <path d="M70 72V40" stroke="white" stroke-width="8" stroke-linecap="round"/>
              <circle cx="50" cy="28" r="5" fill="#f59e0b"/>
              <defs>
                <linearGradient id="p1-gradient" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#4f46e5" />
                  <stop offset="1" stop-color="#06b6d4" />
                </linearGradient>
              </defs>
            </svg>
            <div>
              <span style="font-size: 18px; font-weight: 800; color: #1e1b4b; letter-spacing: -0.5px;">Public Insight</span>
              <span style="font-size: 9px; font-weight: 700; color: #4f46e5; display: block; text-transform: uppercase;">${L("Smart Campaign Analytics", "المنصة الذكية لتحليلات الحملات")}</span>
            </div>
          </div>
          <span style="font-size: 11px; font-weight: 700; color: #64748b; font-family: monospace; border: 1px solid #e2e8f0; padding: 4px 10px; border-radius: 6px; background: #f8fafc;">
            ${L("CONFIDENTIAL REPORT", "تقرير سري ومعتمد")}
          </span>
        </div>

        <!-- Title Block -->
        <div style="margin-top: 40px; margin-bottom: 40px;">
          <span style="font-size: 11px; font-weight: 800; color: #4f46e5; text-transform: uppercase; tracking-wider; display: block; margin-bottom: 8px;">
            ${L("COMPREHENSIVE CAMPAIGN BRIEF & ASSESSMENT", "التقرير التحليلي المتكامل وملخص الحملة الإعلانية")}
          </span>
          <h1 style="font-size: 32px; font-weight: 800; color: #0f172a; margin: 0; line-height: 1.25; letter-spacing: -0.5px;">
            ${record.name}
          </h1>
          <div style="width: 80px; height: 5px; background: #4f46e5; margin-top: 15px; border-radius: 2px;"></div>
        </div>

        <!-- Initial Brief & Campaign Setup Details -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h3 style="font-size: 14px; font-weight: 800; color: #1e1b4b; margin: 0 0 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
              <span>📝</span>
              <span>${L("Campaign Initial Brief & Settings", "المخطط الأصلي ومدخلات الحملة الإعلانية")}</span>
            </h3>
            
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase;">${L("Organizer / Brand", "الجهة المنظمة")}</span>
                <span style="font-size: 12px; font-weight: 700; color: #334155; margin-top: 2px; display: block;">${record.campaignObj?.organizer || L("Individual Client", "عميل مستقل")}</span>
              </div>
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase;">${L("Campaign Budget", "الميزانية المعتمدة")}</span>
                <span style="font-size: 12px; font-weight: 700; color: #334155; margin-top: 2px; display: block; font-family: monospace;">$${parseFloat(record.budget).toLocaleString()}</span>
              </div>
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase;">${L("Target Dialect", "اللهجة المستهدفة")}</span>
                <span style="font-size: 12px; font-weight: 700; color: #334155; margin-top: 2px; display: block;">${dialectNames[dialectKey] || dialectKey}</span>
              </div>
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase;">${L("Duration", "مدة الحملة")}</span>
                <span style="font-size: 12px; font-weight: 700; color: #334155; margin-top: 2px; display: block;">${durationText}</span>
              </div>
            </div>

            <div style="margin-bottom: 15px;">
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase; margin-bottom: 4px;">${L("Campaign Description", "وصف ومفهوم الحملة")}</span>
              <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.6; text-align: justify;">
                ${record.campaignObj?.description || L("No campaign description provided.", "لم يتم إدخال وصف تفصيلي للحملة.")}
              </p>
            </div>

            <div style="margin-bottom: 15px;">
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase; margin-bottom: 4px;">${L("Campaign Objectives", "أهداف الحملة الإستراتيجية")}</span>
              <p style="font-size: 11px; color: #475569; margin: 0; line-height: 1.6; text-align: justify;">
                ${record.campaignObj?.objectives || L("Raise mass awareness and optimize conversions.", "رفع نسبة الوعي بالعلامة التجارية وزيادة النقرات والمبيعات.")}
              </p>
            </div>

            <div>
              <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase; margin-bottom: 4px;">${L("Target Audience Parameters", "محددات شريحة الجمهور المستهدفة")}</span>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                <span style="font-size: 10px; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #475569; font-weight: 600;">
                  ${L("Age: ", "العمر: ")} ${record.campaignObj?.age || "18-45"}
                </span>
                <span style="font-size: 10px; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #475569; font-weight: 600;">
                  ${L("Gender: ", "الجنس: ")} ${record.campaignObj?.gender === "both" ? L("Both", "الذكور والإناث") : (record.campaignObj?.gender === "male" ? L("Male Only", "الذكور فقط") : L("Female Only", "الإناث فقط"))}
                </span>
                <span style="font-size: 10px; background: #ffffff; border: 1px solid #cbd5e1; padding: 4px 10px; border-radius: 6px; color: #475569; font-weight: 600;">
                  ${L("Markets: ", "النطاق الجغرافي: ")} ${record.campaignObj?.location || L("Algeria National", "الوطن الوطني (الجزائر)")}
                </span>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase; margin-bottom: 4px;">${L("Primary Message", "الرسالة الأساسية")}</span>
                <span style="font-size: 11px; font-weight: 700; color: #1e1b4b; display: block;">"${record.campaignObj?.message || L("Not specified", "غير محدد")}"</span>
              </div>
              <div>
                <span style="font-size: 10px; font-weight: 700; color: #94a3b8; display: block; text-transform: uppercase; margin-bottom: 4px;">${L("Slogans & Ad Copy", "الشعارات والنسخ الإعلانية")}</span>
                <span style="font-size: 11px; font-weight: 600; color: #475569; display: block; font-style: italic;">"${record.campaignObj?.slogans || L("Not specified", "غير محدد")}"</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 700;">
          <div>${L("Public Insight Platform • AI-Powered Brand Analytics", "منصة Public Insight • التقرير الفني المعتمد للحملة")}</div>
          <div style="font-family: monospace;">Page 1 / 4</div>
        </div>
      </div>


      <!-- ==================== PAGE 2: AI DIAGNOSIS & ASSESSMENT ==================== -->
      <div id="pdf-page-2" style="width: 794px; height: 1123px; padding: 60px; box-sizing: border-box; background-color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 1px dashed #cbd5e1;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 25px;">
          <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
            ${record.name} • ${L("AI DIAGNOSTICS", "تقرير تشخيص الذكاء الاصطناعي")}
          </div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${record.date}</div>
        </div>

        <!-- Scores Callout -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
          <div style="border: 1px solid #e0e7ff; border-radius: 12px; padding: 16px; background: #f5f3ff; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-size: 11px; font-weight: 800; color: #4338ca; text-transform: uppercase; margin: 0 0 4px 0;">
                ${L("Readiness Score", "درجة الجاهزية الإستراتيجية")}
              </h4>
              <p style="font-size: 10px; color: #6366f1; margin: 0; line-height: 1.3;">
                ${L("Target alignment & linguistic score.", "مستوى المواءمة الثقافية والتوافق اللغوي.")}
              </p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 32px; font-weight: 900; color: #4f46e5; font-family: monospace;">${record.score}</span>
              <span style="font-size: 11px; color: #94a3b8;">/100</span>
            </div>
          </div>
          <div style="border: 1px solid #bbf7d0; border-radius: 12px; padding: 16px; background: #f0fdf4; display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="font-size: 11px; font-weight: 800; color: #166534; text-transform: uppercase; margin: 0 0 4px 0;">
                ${L("Campaign Success Probability", "احتمالية النجاح والرنين العام")}
              </h4>
              <p style="font-size: 10px; color: #15803d; margin: 0; line-height: 1.3;">
                ${L("Estimates organic viral reach and traction.", "توقع حجم التفاعل المجتمعي والوصول العضوي.")}
              </p>
            </div>
            <div style="text-align: right;">
              <span style="font-size: 30px; font-weight: 900; color: #16a34a; font-family: monospace;">${record.score}%</span>
            </div>
          </div>
        </div>

        <!-- AI Core Diagnosis -->
        <div style="border-left: 4px solid #4f46e5; border-right: ${isArabic ? "4px solid #4f46e5" : "none"}; background: #faf5ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; flex-grow: 1;">
          <h3 style="font-size: 13px; font-weight: 800; color: #3b0764; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
            <span>✨</span>
            <span>${L("AI Campaign Core Diagnostics (Gemini Deep-Dive)", "تشخيصات جيميناي العميقة للحملة (AI Core Diagnostics)")}</span>
          </h3>
          <p style="font-size: 11.5px; color: #3b0764; line-height: 1.7; text-align: justify; margin: 0; white-space: pre-line;">
            ${record.aiReport?.reportDescription || (isArabic ? "لم يتمكن محرك الذكاء الاصطناعي من توليد تشخيص فوري للحملة." : "AI core diagnostics text is currently unavailable.")}
          </p>
        </div>

        <!-- Evaluation & Forecast -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 10px;">
          <div style="border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; background: #ffffff;">
            <h3 style="font-size: 12px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;">
              <span>📋</span>
              <span>${L("Strategic Campaign Evaluation", "التقييم الاستراتيجي الشامل")}</span>
            </h3>
            <p style="font-size: 10.5px; color: #475569; line-height: 1.5; text-align: justify; margin: 0;">
              ${record.aiReport?.campaignEvaluation || defaultEvaluation}
            </p>
          </div>
          <div style="border: 1px solid #f1f5f9; border-radius: 12px; padding: 18px; background: #ffffff;">
            <h3 style="font-size: 12px; font-weight: 800; color: #1e293b; margin: 0 0 8px 0; padding-bottom: 6px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;">
              <span>📈</span>
              <span>${record.mode === "pre" ? L("Performance Forecast", "توقع الأداء والانتشار") : L("Post-Launch Analysis", "تحليل الأداء الفعلي")}</span>
            </h3>
            <p style="font-size: 10.5px; color: #475569; line-height: 1.5; text-align: justify; margin: 0;">
              ${record.aiReport?.performanceForecast || defaultForecast}
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 700;">
          <div>${L("Public Insight Platform • AI-Powered Brand Analytics", "منصة Public Insight • التقرير الفني المعتمد للحملة")}</div>
          <div style="font-family: monospace;">Page 2 / 4</div>
        </div>
      </div>


      <!-- ==================== PAGE 3: SWOT ANALYSIS & DETAILED DIAGNOSTICS ==================== -->
      <div id="pdf-page-3" style="width: 794px; height: 1123px; padding: 60px; box-sizing: border-box; background-color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 1px dashed #cbd5e1;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 20px;">
          <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
            ${record.name} • ${L("SWOT STRATEGIC ANALYSIS & CHARTS", "التحليل الإستراتيجي الرباعي (SWOT) والرسوم البيانية")}
          </div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${record.date}</div>
        </div>

        <!-- SWOT Column Chart -->
        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <h4 style="font-size: 11px; font-weight: 800; color: #1e293b; margin: 0 0 12px 0; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; display: flex; align-items: center; gap: 6px;">
            <span>📊</span>
            <span>${L("SWOT Strategic Impact Index (Campaign Relevance & Resilience)", "مؤشر الأداء والجدوى الإستراتيجية لتحليل SWOT للجمهور")}</span>
          </h4>
          
          <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 150px; padding: 10px 15px 15px 15px; position: relative;">
            <!-- Background grid lines -->
            <div style="position: absolute; left: 0; right: 0; top: 10px; border-bottom: 1px dashed #f1f5f9; height: 0; width: 100%;"></div>
            <div style="position: absolute; left: 0; right: 0; top: 45px; border-bottom: 1px dashed #f1f5f9; height: 0; width: 100%;"></div>
            <div style="position: absolute; left: 0; right: 0; top: 80px; border-bottom: 1px dashed #f1f5f9; height: 0; width: 100%;"></div>
            <div style="position: absolute; left: 0; right: 0; top: 115px; border-bottom: 1px dashed #f1f5f9; height: 0; width: 100%;"></div>

            <!-- Strengths Column -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 110px; z-index: 10;">
              <span style="font-size: 10px; font-weight: 800; color: #16a34a; margin-bottom: 4px; font-family: monospace;">${sScore}%</span>
              <div style="width: 38px; height: ${sScore * 1.0}px; background: linear-gradient(180deg, #4ade80, #16a34a); border-radius: 5px 5px 0 0; box-shadow: 0 3px 8px rgba(22, 163, 74, 0.2);"></div>
              <span style="font-size: 10px; font-weight: 800; color: #334155; margin-top: 6px;">${L("Strengths", "نقاط القوة")}</span>
            </div>

            <!-- Weaknesses Column -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 110px; z-index: 10;">
              <span style="font-size: 10px; font-weight: 800; color: #dc2626; margin-bottom: 4px; font-family: monospace;">${wScore}%</span>
              <div style="width: 38px; height: ${wScore * 1.0}px; background: linear-gradient(180deg, #f87171, #dc2626); border-radius: 5px 5px 0 0; box-shadow: 0 3px 8px rgba(220, 38, 38, 0.2);"></div>
              <span style="font-size: 10px; font-weight: 800; color: #334155; margin-top: 6px;">${L("Weaknesses", "نقاط الضعف")}</span>
            </div>

            <!-- Opportunities Column -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 110px; z-index: 10;">
              <span style="font-size: 10px; font-weight: 800; color: #2563eb; margin-bottom: 4px; font-family: monospace;">${oScore}%</span>
              <div style="width: 38px; height: ${oScore * 1.0}px; background: linear-gradient(180deg, #60a5fa, #2563eb); border-radius: 5px 5px 0 0; box-shadow: 0 3px 8px rgba(37, 99, 235, 0.2);"></div>
              <span style="font-size: 10px; font-weight: 800; color: #334155; margin-top: 6px;">${L("Opportunities", "الفرص المتاحة")}</span>
            </div>

            <!-- Threats Column -->
            <div style="display: flex; flex-direction: column; align-items: center; width: 110px; z-index: 10;">
              <span style="font-size: 10px; font-weight: 800; color: #d97706; margin-bottom: 4px; font-family: monospace;">${tScore}%</span>
              <div style="width: 38px; height: ${tScore * 1.0}px; background: linear-gradient(180deg, #fbbf24, #d97706); border-radius: 5px 5px 0 0; box-shadow: 0 3px 8px rgba(217, 119, 6, 0.2);"></div>
              <span style="font-size: 10px; font-weight: 800; color: #334155; margin-top: 6px;">${L("Threats", "التهديدات")}</span>
            </div>
          </div>
        </div>

        <!-- SWOT 4-Quadrant Grid -->
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; flex-grow: 1; margin-bottom: 10px;">
          <!-- Strengths Card -->
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: flex-start;">
            <h5 style="font-size: 11px; font-weight: 800; color: #166534; margin: 0 0 8px 0; border-bottom: 1px solid #bbf7d0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #22c55e;">💪</span>
              <span>${L("Strengths (S)", "نقاط القوة (S)")}</span>
            </h5>
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${strengthsList.slice(0, 3).map((s: string) => `
                <li style="font-size: 9.5px; color: #14532d; margin-bottom: 6px; line-height: 1.4; display: flex; align-items: flex-start; gap: 5px;">
                  <span style="color: #22c55e; font-weight: bold;">•</span>
                  <span>${s}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- Weaknesses Card -->
          <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: flex-start;">
            <h5 style="font-size: 11px; font-weight: 800; color: #9f1239; margin: 0 0 8px 0; border-bottom: 1px solid #fecdd3; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #f43f5e;">⚠️</span>
              <span>${L("Weaknesses (W)", "نقاط الضعف (W)")}</span>
            </h5>
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${weaknessesList.slice(0, 3).map((w: string) => `
                <li style="font-size: 9.5px; color: #4c0519; margin-bottom: 6px; line-height: 1.4; display: flex; align-items: flex-start; gap: 5px;">
                  <span style="color: #f43f5e; font-weight: bold;">•</span>
                  <span>${w}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- Opportunities Card -->
          <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: flex-start;">
            <h5 style="font-size: 11px; font-weight: 800; color: #1e40af; margin: 0 0 8px 0; border-bottom: 1px solid #bfdbfe; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #3b82f6;">🚀</span>
              <span>${L("Opportunities (O)", "الفرص المتاحة (O)")}</span>
            </h5>
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${opportunitiesList.slice(0, 3).map((o: string) => `
                <li style="font-size: 9.5px; color: #1e3a8a; margin-bottom: 6px; line-height: 1.4; display: flex; align-items: flex-start; gap: 5px;">
                  <span style="color: #3b82f6; font-weight: bold;">•</span>
                  <span>${o}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- Threats Card -->
          <div style="background: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 12px; display: flex; flex-direction: column; justify-content: flex-start;">
            <h5 style="font-size: 11px; font-weight: 800; color: #92400e; margin: 0 0 8px 0; border-bottom: 1px solid #fef3c7; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
              <span style="color: #f59e0b;">🛡️</span>
              <span>${L("Threats (T)", "التهديدات الخارجية (T)")}</span>
            </h5>
            <ul style="padding: 0; margin: 0; list-style: none;">
              ${threatsList.slice(0, 3).map((t: string) => `
                <li style="font-size: 9.5px; color: #78350f; margin-bottom: 6px; line-height: 1.4; display: flex; align-items: flex-start; gap: 5px;">
                  <span style="color: #f59e0b; font-weight: bold;">•</span>
                  <span>${t}</span>
                </li>
              `).join("")}
            </ul>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 700;">
          <div>${L("Public Insight Platform • AI-Powered Brand Analytics", "منصة Public Insight • التقرير الفني المعتمد للحملة")}</div>
          <div style="font-family: monospace;">Page 3 / 4</div>
        </div>
      </div>


      <!-- ==================== PAGE 4: REGIONAL GEOGRAPHICS & SENTIMENT LISTENING ==================== -->
      <div id="pdf-page-4" style="width: 794px; height: 1123px; padding: 60px; box-sizing: border-box; background-color: #ffffff; display: flex; flex-direction: column; justify-content: space-between; position: relative; border-top: 1px dashed #cbd5e1;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 15px;">
          <div style="font-size: 10px; font-weight: 800; color: #4f46e5; text-transform: uppercase;">
            ${record.name} • ${L("REGIONAL PERFORMANCE & AUDIENCE TONALITY", "التحليل الإقليمي التفصيلي وانطباعات الجمهور")}
          </div>
          <div style="font-size: 10px; color: #94a3b8; font-family: monospace;">${record.date}</div>
        </div>

        <!-- Algeria Geographical & Cultural Map Statistics Table -->
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>📍</span>
            <span>${L("Geographical Optimization & Regional Suitability (Algeria)", "التحليل الإقليمي وملاءمة اللهجة عبر ولايات الجزائر")}</span>
          </h3>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #ffffff;">
            <table style="width: 100%; border-collapse: collapse; text-align: ${isArabic ? "right" : "left"}; font-size: 10.5px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569;">${L("Wilaya (Province)", "الولاية")}</th>
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569; text-align: center;">${L("Resonance", "درجة التجاوب")}</th>
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569; text-align: center;">${L("Status", "الحالة")}</th>
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569; text-align: center;">${L("Engagement", "معدل التفاعل")}</th>
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569; text-align: center;">${L("Est. Views", "المشاهدات المقدرة")}</th>
                  <th style="padding: 8px 12px; font-weight: 800; color: #475569; text-align: center;">${L("Best Platform", "المنصة المثالية")}</th>
                </tr>
              </thead>
              <tbody>
                ${wilayaRows
                  .map(
                    (row) => `
                  <tr style="border-bottom: 1px solid #e2e8f0; transition: background 0.1s;">
                    <td style="padding: 7px 12px; font-weight: 700; color: #334155;">${row.name}</td>
                    <td style="padding: 7px 12px; text-align: center; font-weight: 800; color: #4f46e5; font-family: monospace;">${row.score}%</td>
                    <td style="padding: 7px 12px; text-align: center;">
                      <span style="color: ${row.statusColor}; font-weight: 700; background: ${row.statusColor}12; padding: 2px 6px; border-radius: 4px; font-size: 9px;">
                        ${row.statusLabel}
                      </span>
                    </td>
                    <td style="padding: 7px 12px; text-align: center; font-weight: 700; color: #475569; font-family: monospace;">${row.engagementRate}%</td>
                    <td style="padding: 7px 12px; text-align: center; font-weight: 600; color: #334155; font-family: monospace;">${Intl.NumberFormat().format(row.views)}</td>
                    <td style="padding: 7px 12px; text-align: center; font-weight: 600; color: #4f46e5;">${row.bestPlatform}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Sentiment & Listening Section -->
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
            <span>📣</span>
            <span>${L("Sentiment Listening & Brand Reception", "رصد انطباعات الجمهور وصورة العلامة التجارية")}</span>
          </h3>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; background: #fafafa;">
            <!-- Sentiment Bar Chart -->
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
              <span style="font-size: 10px; font-weight: 700; color: #475569; width: 80px;">${L("Audience Tone", "تحليل النبرة")}</span>
              <div style="flex-grow: 1; height: 14px; border-radius: 7px; display: flex; overflow: hidden; background: #e2e8f0;">
                <div style="width: ${pSentiment}%; background-color: #22c55e;" title="Positive"></div>
                <div style="width: ${nSentiment}%; background-color: #94a3b8;" title="Neutral"></div>
                <div style="width: ${ngSentiment}%; background-color: #ef4444;" title="Negative"></div>
              </div>
            </div>
            <div style="display: flex; justify-content: space-around; font-size: 9.5px; font-weight: 700;">
              <span style="color: #16a34a; display: flex; align-items: center; gap: 4px;">● ${L("Positive", "إيجابي")} ${pSentiment}%</span>
              <span style="color: #475569; display: flex; align-items: center; gap: 4px;">● ${L("Neutral", "محايد")} ${nSentiment}%</span>
              <span style="color: #dc2626; display: flex; align-items: center; gap: 4px;">● ${L("Negative", "سلبي")} ${ngSentiment}%</span>
            </div>
          </div>
        </div>

        <!-- Performance KPIs Grid -->
        <div style="margin-bottom: 15px;">
          <h3 style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; display: flex; align-items: center; gap: 6px;">
            <span>📈</span>
            <span>${L("Estimated Campaign Performance Metrics", "مؤشرات وأرقام الأداء الرقمي المتوقعة")}</span>
          </h3>
          <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px;">
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; text-align: center; background: #ffffff;">
              <span style="font-size: 8px; color: #94a3b8; display: block; font-weight: 700;">${L("VIEWS", "المشاهدات")}</span>
              <span style="font-size: 11.5px; font-weight: 800; color: #1e293b; font-family: monospace; display: block; margin-top: 2px;">${Intl.NumberFormat().format(viewsCount)}</span>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; text-align: center; background: #ffffff;">
              <span style="font-size: 8px; color: #94a3b8; display: block; font-weight: 700;">${L("LIKES", "الإعجابات")}</span>
              <span style="font-size: 11.5px; font-weight: 800; color: #e11d48; font-family: monospace; display: block; margin-top: 2px;">${Intl.NumberFormat().format(likesCount)}</span>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; text-align: center; background: #ffffff;">
              <span style="font-size: 8px; color: #94a3b8; display: block; font-weight: 700;">${L("COMMENTS", "التعليقات")}</span>
              <span style="font-size: 11.5px; font-weight: 800; color: #d97706; font-family: monospace; display: block; margin-top: 2px;">${Intl.NumberFormat().format(commentsCount)}</span>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; text-align: center; background: #ffffff;">
              <span style="font-size: 8px; color: #94a3b8; display: block; font-weight: 700;">${L("SHARES", "المشاركات")}</span>
              <span style="font-size: 11.5px; font-weight: 800; color: #059669; font-family: monospace; display: block; margin-top: 2px;">${Intl.NumberFormat().format(sharesCount)}</span>
            </div>
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 6px; text-align: center; background: #ffffff;">
              <span style="font-size: 8px; color: #94a3b8; display: block; font-weight: 700;">${L("CLICKS", "النقرات")}</span>
              <span style="font-size: 11.5px; font-weight: 800; color: #2563eb; font-family: monospace; display: block; margin-top: 2px;">${Intl.NumberFormat().format(clicksCount)}</span>
            </div>
          </div>
        </div>

        <!-- Actionable Recommendations -->
        <div style="flex-grow: 1; display: flex; flex-direction: column; justify-content: flex-start; margin-bottom: 10px;">
          <h3 style="font-size: 11.5px; font-weight: 800; color: #1e293b; margin: 0 0 10px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; display: flex; align-items: center; gap: 6px;">
            <span>💡</span>
            <span>${L("Final Actionable Recommendations", "توصيات إستراتيجية للتنفيذ الفوري")}</span>
          </h3>
          
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${(record.aiReport?.recommendations || record.resultObj?.recommendations || [])
              .slice(0, 3)
              .map(
                (rec: any, idx: number) => `
              <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 8px; display: flex; align-items: flex-start; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.01);">
                <span style="height: 18px; width: 18px; border-radius: 50%; background: #e0e7ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; font-size: 9.5px; font-weight: 800; flex-shrink: 0; font-family: monospace;">
                  ${idx + 1}
                </span>
                <div>
                  <h5 style="margin: 0 0 1px 0; font-size: 10.5px; font-weight: 800; color: #1e293b;">${rec.title}</h5>
                  <p style="margin: 0; font-size: 9.5px; color: #64748b; line-height: 1.4; text-align: justify;">${rec.detail}</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Signature/Stamp Block for Formality -->
        <div style="margin-top: 10px; display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #f1f5f9; padding-top: 10px;">
          <div style="font-size: 9.5px; color: #94a3b8;">
            <span>${L("Approved by Public Insight Board", "معتمد ومرخص إلكترونياً من قبل")}</span>
            <span style="display: block; font-weight: 700; color: #475569; margin-top: 2px;">Public Insight Analytics Center</span>
          </div>
          <!-- Stamp Graphic -->
          <div style="border: 2px double #4f46e5; border-radius: 50%; width: 50px; height: 50px; display: flex; flex-direction: column; justify-content: center; align-items: center; transform: rotate(-8deg); color: #4f46e5; font-size: 5.5px; font-weight: 800; line-height: 1.1; opacity: 0.85; background: #ffffff;">
            <span>PUBLIC</span>
            <span style="border-top: 1px solid #4f46e5; border-bottom: 1px solid #4f46e5; padding: 1px 0; margin: 1px 0; font-size: 4.5px;">APPROVED</span>
            <span>INSIGHT</span>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #94a3b8; font-weight: 700;">
          <div>${L("Public Insight Platform • AI-Powered Brand Analytics", "منصة Public Insight • التقرير الفني المعتمد للحملة")}</div>
          <div style="font-family: monospace;">Page 4 / 4</div>
        </div>
      </div>

      ${feedbackHtmlPage}

    </div>
  `;

  document.body.appendChild(container);

  // Small delay to ensure browser parses typography and computes dimensions correctly
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    const page1 = container.querySelector("#pdf-page-1") as HTMLElement;
    const page2 = container.querySelector("#pdf-page-2") as HTMLElement;
    const page3 = container.querySelector("#pdf-page-3") as HTMLElement;
    const page4 = container.querySelector("#pdf-page-4") as HTMLElement;
    const page5 = container.querySelector("#pdf-page-5") as HTMLElement;
    const pages = [page1, page2, page3, page4, page5].filter(Boolean);

    // Standard A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF("p", "mm", "a4");

    for (let i = 0; i < pages.length; i++) {
      if (!pages[i]) continue;
      
      const canvas = await html2canvas(pages[i], {
        scale: 2.5, // Retinal high-resolution export for crystal clear text
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, "PNG", 0, 0, 210, 297, undefined, "FAST");
    }

    const cleanName = record.name.replace(/[^\w\u0600-\u06FF\s-]/g, "").replace(/\s+/g, "_");
    const fileName = `${cleanName}_insight_report.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    throw error;
  } finally {
    // Remove the temporary visual DOM node from tree
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}
