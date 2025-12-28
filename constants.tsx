
import { Node, FileNode } from './types';

export const INITIAL_DATA: Node[] = [
  // Top Level Folders
  {
    id: 'f-concepts',
    name: 'Messianic Concepts | מושגים וערכים',
    type: 'folder',
    parentId: null,
    createdAt: Date.now(),
  },
  {
    id: 'f-belief',
    name: 'Belief & Anticipation | אמונה וציפייה',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 10,
  },
  {
    id: 'f-destinies',
    name: 'Redemptive Prophecies | יעודי הגאולה',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 20,
  },
  {
    id: 'f-sages',
    name: 'Teachings of the Sages | ילקוט ביאורי חז"ל',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 30,
  },
  {
    id: 'f-notes',
    name: 'Scholarly Insights | הערות וביאורים',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 40,
  },
  {
    id: 'f-rambam',
    name: 'Maimonides Studies | ביאורי הרמב"ם',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 50,
  },
  {
    id: 'f-seforim',
    name: 'The Classic Library | אוצר הספרים',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 60,
  },
  {
    id: 'f-videos',
    name: 'Multimedia Archive | תיעוד ומדיה',
    type: 'folder',
    parentId: null,
    createdAt: Date.now() - 70,
  },

  // Subfolders
  {
    id: 'sf-seforim-portals',
    name: 'Digital Libraries | ספריות דיגיטליות',
    type: 'folder',
    parentId: 'f-seforim',
    createdAt: Date.now() - 71,
  },
  {
    id: 'sf-seforim-list',
    name: 'Seforim Archive | ארכיון ספרים',
    type: 'folder',
    parentId: 'f-seforim',
    createdAt: Date.now() - 72,
  },
  {
    id: 'sf-articles-deep',
    name: 'Articles & Deep Dives | מאמרים ועיונים',
    type: 'folder',
    parentId: 'f-videos',
    createdAt: Date.now() - 73,
  },
  {
    id: 'sf-portals',
    name: 'Video Portals | פורטלי וידאו',
    type: 'folder',
    parentId: 'f-videos',
    createdAt: Date.now() - 74,
  },
  {
    id: 'sf-new-torah',
    name: 'The New Torah | תורה חדשה',
    type: 'folder',
    parentId: 'f-concepts',
    createdAt: Date.now() - 80,
  },
  {
    id: 'sf-elijah',
    name: 'Prophet Elijah | עניני אליהו הנביא',
    type: 'folder',
    parentId: 'f-concepts',
    createdAt: Date.now() - 90,
  },
  {
    id: 'sf-rambam-12',
    name: 'Chapter 12 | הלכות מלכים פרק י"ב',
    type: 'folder',
    parentId: 'f-rambam',
    createdAt: Date.now() - 100,
  },
  {
    id: 'sf-rambam-11',
    name: 'Chapter 11 | הלכות מלכים פרק י"א',
    type: 'folder',
    parentId: 'f-rambam',
    createdAt: Date.now() - 110,
  },

  // Sample Videos to ensure featured section is visible
  {
    id: 'v-1',
    name: 'The Era of Moshiach | ימות המשיח: חזון הגאולה',
    type: 'file',
    parentId: 'f-videos',
    // Fix: Using contentEn instead of content to match FileNode type
    contentEn: '<p>A deep exploration into the nature of the Messianic era based on the teachings of Maimonides and Chassidic philosophy.</p>',
    contentType: 'video',
    url: 'https://www.youtube.com/watch?v=xvFZjo5PgG0',
    createdAt: Date.now() - 5,
  },
  {
    id: 'v-2',
    name: 'Anticipating Redemption | ציפייה לישועה',
    type: 'file',
    parentId: 'f-videos',
    // Fix: Using contentEn instead of content to match FileNode type
    contentEn: '<p>Insights into the daily mitzvah of "Anticipating the Redemption" and its practical application in our generation.</p>',
    contentType: 'video',
    url: 'https://www.youtube.com/watch?v=S8L_zO9i9iY',
    createdAt: Date.now() - 6,
  },

  // Note Entry
  {
    id: 'note-synagogues-israel',
    name: 'Future Synagogues in Israel | בתי כנסיות שבבבל עתידים שיקבעו בארץ ישראל',
    type: 'file',
    parentId: 'f-notes',
    // Fix: Using contentEn instead of content to match FileNode type
    contentEn: `
      <div dir="rtl" class="text-right">
        <p class="mb-6 opacity-60">בס"ד</p>
        <h2 class="text-3xl font-bold mb-8">בענין בתי כנסיות ובתי מדרשות שבבבל שעתידים שיקבעו בארץ ישראל</h2>
        
        <p class="mb-6">בגמרא מסכת מגילה כט, א כתיב: תניא רבי אלעזר הקפר אומר, עתידים בתי כנסיות ובתי מדרשות שבבבל שיקבעו בארץ ישראל, שנאמר (ירמיה מו, יח) כי כתבור בהרים וככרמל בים יבוא.</p>
        
        <div class="space-y-6 text-xl leading-relaxed opacity-90">
          <p>והלא דברים קל וחומר, ומה תבור וככרמל שלא באו אלא לפי שעה ללמוד תורה, נקבעו בארץ ישראל, בתי כנסיות ובתי מדרשות שקורין ומרביצין בהם תורה, על אחת כמה וכמה.</p>
          
          <p><strong>השיטות השונות בזה:</strong></p>
          
          <ul class="list-disc pr-6 space-y-4">
            <li><strong>שיטת המהר"ם שיק וסיעתו:</strong> שהבנינים ביחד עם הקרקע יקבעו בארץ ישראל.</li>
            <li><strong>שיטת אליה רבה (סימן קנ"א):</strong> עכ"פ יש לומר שאף שהקרקע תקבע בארץ ישראל, אולי יהיה להם רק קדושת ארץ ישראל ולא קדושת בית הכנסת.</li>
            <li><strong>שיטת נתיב חיים:</strong> שיקבעו בארץ ישראל בשיטת המהר"ם וגם יבוא ממש הבית להיות כנסייה.</li>
            <li><strong>שיטת הרבי מליובאוויטש (קונטרס בית רבינו שבבבל):</strong> מבאר שהענין בזה הוא חזרת השכינה מאותם בתי כנסיות לארץ ישראל, וקדושתם של בתי כנסיות אלו תשאר קבועה ונצחית.</li>
          </ul>

          <p class="mt-8 font-bold text-2xl">ויה"ר שנזכה לקיום כל היעודים תומ"י ממש בחסד וברחמים!</p>
        </div>
      </div>
    `,
    contentType: 'text',
    createdAt: Date.now() - 41,
  }
];
