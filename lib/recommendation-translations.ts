export type RecommendationType = 'recommendation' | 'endorsement'
export type RecommendationLanguage = 'en' | 'fr' | 'pt' | 'ar' | 'es' | 'de'

export const recommendationTranslations = {
  en: {
    recommendationTitle: 'Letter of Recommendation',
    endorsementTitle: 'Professional Endorsement',
    toWhomItMayConcern: 'To Whom It May Concern,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `I am pleased to provide this letter of recommendation for ${studentName}, who has successfully completed the professional certification in ${programTitle} at IICAR Professional School. Throughout the program, ${studentName} demonstrated exceptional commitment to learning, outstanding technical proficiency, and a comprehensive grasp of the course material.\n\n${studentName} consistently displayed a strong work ethic, excellent problem-solving abilities, and the capacity to apply theoretical knowledge to practical situations. Their engagement with peers and instructors was professional and collaborative, contributing positively to the learning environment.\n\nThe competencies acquired during this certification program have prepared ${studentName} to excel in professional roles requiring specialized expertise and leadership qualities. Based on the demonstrated performance and achievements throughout the program, I am confident that ${studentName} possesses the knowledge, skills, and character to succeed in advancing their professional career.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `This is to certify that ${studentName} has successfully completed and demonstrated professional competency and mastery in the ${programTitle} certification program offered by IICAR Professional School. Throughout the intensive training and assessment process, ${studentName} exhibited exceptional technical proficiency and a thorough understanding of industry-relevant practices.\n\nThe skills and knowledge acquired include advanced technical competencies, professional methodologies, and best practices in the field. ${studentName} has proven the ability to apply these competencies effectively in professional contexts and to continue developing expertise independently.\n\nWe hereby endorse ${studentName}'s professional qualifications and competency in ${programTitle}. This certification represents a verified achievement of professional standards and readiness for advancement in the field.`,
    conclusion: 'I am confident that this individual will make a valuable contribution to any organization and am available to discuss their qualifications in further detail upon request.',
    sincerely: 'Sincerely,',
    registrar: 'Office of the Registrar',
    directorPrograms: 'Director, Professional Programs',
    icarAcademy: 'IICAR Professional School',
    generatedDate: 'Generated Date:',
    multipleRecommendationIntro: (studentName: string) =>
      `This letter of recommendation is provided for ${studentName}, who has successfully completed the following professional certification program(s) at IICAR Global College:`,
    multipleEndorsementIntro: (studentName: string) =>
      `This professional endorsement is provided for ${studentName}, who has successfully completed and demonstrated competency in the following professional certification program(s) at IICAR Global College:`,
    multipleRecommendationBody: (studentName: string) =>
      `Throughout these professional development programs, ${studentName} demonstrated exceptional commitment to learning, outstanding technical proficiency, and comprehensive understanding of the subject matter. ${studentName} consistently displayed strong work ethic, excellent problem-solving abilities, and the capacity to apply theoretical knowledge to practical situations.\n\nThe completion of these multiple certifications demonstrates ${studentName}'s dedication to professional development and mastery of diverse professional competencies. This individual is well-prepared to apply these skills in professional roles requiring specialized expertise and leadership qualities.`,
    multipleEndorsementBody: (studentName: string) =>
      `Through the completion of these professional certification programs, ${studentName} has demonstrated exceptional technical proficiency and mastery of industry-relevant practices.`,
  },
  fr: {
    recommendationTitle: 'Lettre de Recommandation',
    endorsementTitle: 'Approbation Professionnelle',
    toWhomItMayConcern: 'À qui de droit,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Je suis heureux de fournir cette lettre de recommandation pour ${studentName}, qui a complété avec succès la certification professionnelle en ${programTitle} à l'École Professionnelle IICAR. Tout au long du programme, ${studentName} a démontré un engagement exceptionnel envers l'apprentissage, une maîtrise technique remarquable et une compréhension approfondie du contenu du cours.\n\n${studentName} a constamment fait preuve d'une solide éthique de travail, d'excellentes capacités de résolution de problèmes et de la capacité d'appliquer des connaissances théoriques à des situations pratiques. Son engagement avec les pairs et les instructeurs a été professionnel et collaboratif, contribuant positivement à l'environnement d'apprentissage.\n\nLes compétences acquises au cours de ce programme de certification ont préparé ${studentName} à exceller dans des rôles professionnels nécessitant une expertise spécialisée et des qualités de leadership. Sur la base des performances et des réalisations démontrées tout au long du programme, je suis convaincu que ${studentName} possède les connaissances, les compétences et le caractère nécessaires pour réussir à faire progresser leur carrière professionnelle.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Ceci certifie que ${studentName} a complété avec succès et démontré une compétence professionnelle et une maîtrise dans le programme de certification ${programTitle} offert par l'École Professionnelle IICAR. Tout au long du processus de formation intensive et d'évaluation, ${studentName} a fait preuve d'une maîtrise technique exceptionnelle et d'une compréhension approfondie des pratiques pertinentes pour l'industrie.\n\nLes compétences et les connaissances acquises incluent des compétences techniques avancées, des méthodologies professionnelles et des meilleures pratiques dans le domaine. ${studentName} a prouvé la capacité d'appliquer ces compétences efficacement dans des contextes professionnels et de continuer à développer son expertise de manière autonome.\n\nNous soutenons par la présente les qualifications professionnelles et la compétence de ${studentName} dans ${programTitle}. Cette certification représente une réalisation vérifiée des normes professionnelles et une préparation à l'avancement dans le domaine.`,
    conclusion: 'Je suis confiant que cette personne apportera une contribution précieuse à toute organisation et je suis disponible pour discuter de ses qualifications de manière plus détaillée si nécessaire.',
    sincerely: 'Sincèrement,',
    registrar: 'Bureau du Registraire',
    directorPrograms: 'Directeur, Programmes Professionnels',
    icarAcademy: 'École Professionnelle IICAR',
    generatedDate: 'Date de génération :',
    multipleRecommendationIntro: (studentName: string) =>
      `Cette lettre de recommandation est fournie pour ${studentName}, qui a complété avec succès le(s) programme(s) de certification professionnelle suivant(s) au Collège Mondial IICAR :`,
    multipleEndorsementIntro: (studentName: string) =>
      `Cette approbation professionnelle est fournie pour ${studentName}, qui a complété avec succès et démontré sa compétence dans le(s) programme(s) de certification professionnelle suivant(s) au Collège Mondial IICAR :`,
    multipleRecommendationBody: (studentName: string) =>
      `Tout au long de ces programmes de développement professionnel, ${studentName} a démontré un engagement exceptionnel envers l'apprentissage, une maîtrise technique exceptionnelle et une compréhension approfondie du sujet. ${studentName} a constamment fait preuve d'une solide éthique de travail, d'excellentes capacités de résolution de problèmes et de la capacité d'appliquer des connaissances théoriques à des situations pratiques.\n\nL'obtention de ces certifications multiples démontre l'engagement de ${studentName} envers le développement professionnel et la maîtrise de compétences professionnelles diverses. Cette personne est bien préparée pour appliquer ces compétences dans des rôles professionnels nécessitant une expertise spécialisée et des qualités de leadership.`,
    multipleEndorsementBody: (studentName: string) =>
      `Grâce à l'achèvement de ces programmes de certification professionnelle, ${studentName} a démontré une compétence technique exceptionnelle et une maîtrise des pratiques pertinentes pour l'industrie.`,
  },
  pt: {
    recommendationTitle: 'Carta de Recomendação',
    endorsementTitle: 'Aprovação Profissional',
    toWhomItMayConcern: 'A quem interessar possa,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Tenho o prazer de fornecer esta carta de recomendação para ${studentName}, que completou com sucesso a certificação profissional em ${programTitle} na IICAR Professional School. Ao longo do programa, ${studentName} demonstrou um compromisso excepcional com a aprendizagem, proficiência técnica notável e uma compreensão abrangente do conteúdo do curso.\n\n${studentName} consistentemente demonstrou uma forte ética de trabalho, excelentes habilidades de resolução de problemas e a capacidade de aplicar conhecimento teórico a situações práticas. Seu envolvimento com colegas e instrutores foi profissional e colaborativo, contribuindo positivamente para o ambiente de aprendizagem.\n\nAs competências adquiridas durante este programa de certificação prepararam ${studentName} para se destacar em funções profissionais que exigem expertise especializada e qualidades de liderança. Com base no desempenho e nas realizações demonstradas ao longo do programa, estou confiante de que ${studentName} possui o conhecimento, as habilidades e o caráter para avançar com sucesso em sua carreira profissional.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Isto certifica que ${studentName} concluiu com sucesso e demonstrou competência profissional e domínio no programa de certificação ${programTitle} oferecido pela IICAR Professional School. Ao longo do processo intensivo de treinamento e avaliação, ${studentName} exibiu proficiência técnica excepcional e uma compreensão aprofundada das práticas relevantes para a indústria.\n\nAs habilidades e conhecimentos adquiridos incluem competências técnicas avançadas, metodologias profissionais e melhores práticas no campo. ${studentName} provou a capacidade de aplicar essas competências de forma eficaz em contextos profissionais e de continuar a desenvolver expertise de forma independente.\n\nEndossamos, por meio deste, as qualificações profissionais e a competência de ${studentName} em ${programTitle}. Esta certificação representa uma conquista verificada de padrões profissionais e prontidão para avanço no campo.`,
    conclusion: 'Tenho confiança de que este indivíduo fará uma contribuição valiosa para qualquer organização e estou disponível para discutir suas qualificações em mais detalhes se solicitado.',
    sincerely: 'Atenciosamente,',
    registrar: 'Gabinete do Registrador',
    directorPrograms: 'Diretor, Programas Profissionais',
    icarAcademy: 'IICAR Professional School',
    generatedDate: 'Data de Geração:',
    multipleRecommendationIntro: (studentName: string) =>
      `Esta carta de recomendação é fornecida para ${studentName}, que completou com sucesso o(s) seguinte(s) programa(s) de certificação profissional no IICAR Global College:`,
    multipleEndorsementIntro: (studentName: string) =>
      `Esta aprovação profissional é fornecida para ${studentName}, que completou com sucesso e demonstrou competência no(s) seguinte(s) programa(s) de certificação profissional no IICAR Global College:`,
    multipleRecommendationBody: (studentName: string) =>
      `Ao longo desses programas de desenvolvimento profissional, ${studentName} demonstrou comprometimento excepcional com a aprendizagem, proficiência técnica notável e compreensão abrangente do assunto. ${studentName} consistentemente exibiu forte ética de trabalho, excelentes habilidades de resolução de problemas e capacidade de aplicar conhecimento teórico a situações práticas.\n\nA conclusão dessas certificações múltiplas demonstra a dedicação de ${studentName} ao desenvolvimento profissional e o domínio de competências profissionais diversas. Este indivíduo está bem preparado para aplicar essas habilidades em funções profissionais que exigem expertise especializada e qualidades de liderança.`,
    multipleEndorsementBody: (studentName: string) =>
      `Através da conclusão desses programas de certificação profissional, ${studentName} demonstrou proficiência técnica excepcional e domínio de práticas relevantes para a indústria.`,
  },
  ar: {
    recommendationTitle: 'خطاب توصية',
    endorsementTitle: 'تأييد مهني',
    toWhomItMayConcern: 'إلى من يهمه الأمر،',
    recommendationBody: (studentName: string, programTitle: string) =>
      `يسعدني تقديم خطاب التوصية هذا لـ ${studentName}، الذي أكمل بنجاح شهادة مهنية في ${programTitle} في مدرسة IICAR المهنية. خلال البرنامج، أظهر ${studentName} التزاماً استثنائياً بالتعلم وكفاءة تقنية متميزة وفهماً شاملاً لمحتوى الدورة.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `نشهد بموجب هذا أن ${studentName} أكمل بنجاح وأظهر كفاءة مهنية وإتقاناً في برنامج شهادة ${programTitle} الذي تقدمه مدرسة IICAR المهنية.`,
    conclusion: 'أنا واثق من أن هذا الشخص سيقدم مساهمة قيّمة لأي مؤسسة، ويسعدني مناقشة مؤهلاته بمزيد من التفصيل عند الطلب.',
    sincerely: 'مع خالص التحية،',
    registrar: 'مكتب التسجيل',
    directorPrograms: 'مدير البرامج المهنية',
    icarAcademy: 'مدرسة IICAR المهنية',
    generatedDate: 'تاريخ الإنشاء:',
    multipleRecommendationIntro: (studentName: string) =>
      `يُقدّم خطاب التوصية هذا لـ ${studentName}، الذي أكمل بنجاح برامج الشهادات المهنية التالية في كلية IICAR العالمية:`,
    multipleEndorsementIntro: (studentName: string) =>
      `يُقدّم هذا التأييد المهني لـ ${studentName}، الذي أكمل بنجاح وأثبت كفاءته في برامج الشهادات المهنية التالية في كلية IICAR العالمية:`,
    multipleRecommendationBody: (studentName: string) =>
      `خلال هذه البرامج، أظهر ${studentName} التزاماً استثنائياً بالتعلم وكفاءة تقنية متميزة وفهماً شاملاً للموضوع.`,
    multipleEndorsementBody: (studentName: string) =>
      `من خلال إكمال هذه البرامج، أظهر ${studentName} كفاءة تقنية استثنائية وإتقاناً للممارسات ذات الصلة بالصناعة.`,
  },
  es: {
    recommendationTitle: 'Carta de Recomendación',
    endorsementTitle: 'Aval Profesional',
    toWhomItMayConcern: 'A quien corresponda,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Me complace proporcionar esta carta de recomendación para ${studentName}, quien completó con éxito la certificación profesional en ${programTitle} en IICAR Professional School.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Por medio de la presente certificamos que ${studentName} completó con éxito y demostró competencia profesional en el programa de certificación ${programTitle} ofrecido por IICAR Professional School.`,
    conclusion: 'Confío en que esta persona contribuirá valiosamente a cualquier organización y estoy disponible para ampliar información sobre sus cualificaciones.',
    sincerely: 'Atentamente,',
    registrar: 'Oficina del Registrador',
    directorPrograms: 'Director de Programas Profesionales',
    icarAcademy: 'IICAR Professional School',
    generatedDate: 'Fecha de generación:',
    multipleRecommendationIntro: (studentName: string) => `Esta carta se proporciona para ${studentName}, quien completó los siguientes programas de certificación profesional:`,
    multipleEndorsementIntro: (studentName: string) => `Este aval profesional se proporciona para ${studentName}, quien demostró competencia en los siguientes programas:`,
    multipleRecommendationBody: (studentName: string) => `Durante estos programas, ${studentName} demostró un compromiso excepcional con el aprendizaje y sólidas competencias profesionales.`,
    multipleEndorsementBody: (studentName: string) => `Al completar estos programas, ${studentName} demostró una competencia técnica excepcional.`,
  },
  de: {
    recommendationTitle: 'Empfehlungsschreiben',
    endorsementTitle: 'Berufliche Bestätigung',
    toWhomItMayConcern: 'Sehr geehrte Damen und Herren,',
    recommendationBody: (studentName: string, programTitle: string) =>
      `Gerne stelle ich dieses Empfehlungsschreiben für ${studentName} aus, der die berufliche Zertifizierung in ${programTitle} an der IICAR Professional School erfolgreich abgeschlossen hat.`,
    endorsementBody: (studentName: string, programTitle: string) =>
      `Hiermit bestätigen wir, dass ${studentName} das Zertifizierungsprogramm ${programTitle} an der IICAR Professional School erfolgreich abgeschlossen und berufliche Kompetenz bewiesen hat.`,
    conclusion: 'Ich bin überzeugt, dass diese Person für jede Organisation einen wertvollen Beitrag leisten wird.',
    sincerely: 'Mit freundlichen Grüßen,',
    registrar: 'Registratur',
    directorPrograms: 'Direktor, Berufliche Programme',
    icarAcademy: 'IICAR Professional School',
    generatedDate: 'Erstellungsdatum:',
    multipleRecommendationIntro: (studentName: string) => `Dieses Empfehlungsschreiben wird für ${studentName} ausgestellt, der folgende berufliche Zertifizierungsprogramme abgeschlossen hat:`,
    multipleEndorsementIntro: (studentName: string) => `Diese berufliche Bestätigung wird für ${studentName} ausgestellt, der in folgenden Programmen Kompetenz bewiesen hat:`,
    multipleRecommendationBody: (studentName: string) => `Während dieser Programme zeigte ${studentName} außergewöhnliches Engagement und starke berufliche Kompetenzen.`,
    multipleEndorsementBody: (studentName: string) => `Durch den Abschluss dieser Programme bewies ${studentName} außergewöhnliche technische Kompetenz.`,
  },
}
