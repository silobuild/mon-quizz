const PROFILS = {
  P1: { t: 'Premier "amour de jeunesse" d\'ado', d: `Collège ou lycée, histoire brève mais très voire trop fusionnelle, la découverte de premiers sentiments prononcés ; s'est arrêtée rapidement et n'a jamais repris, tout en laissant une marque très spéciale, comme belle et inachevée.` },
  P2: { t: 'Histoire brève de jeunesse', d: `Lycée ou supérieur, relativement intense, fusionnel mais assez court, pas une réelle rupture, juste un bref moment de flirt qui n'a pas vraiment laissé quelque chose derrière lui.` },
  P3: { t: 'Ex de long terme', d: `Relation "sérieuse" d'environ 1 an ou plus, a structuré une période, un espoir de vraiment continuer et construire ensemble. Le premier amour réellement profond, donc la première rupture... réellement profonde aussi.` },
  P4: { t: 'Ami ++', d: `Un amour platonique jamais avoué ou jamais concrétisé, sans savoir vraiment pourquoi. Comme si la porte était grande ouverte mais que quelque chose faisait qu'on y entrait pas quand même. Des flashbacks de temps en temps, mais rien de spécial si ce n'est "qu'est ce que ça aurait pu donner ?".` },
  P5: { t: `L'entre-deux`, d: `Une relation mi-sérieuse, mi-flirt. Sans savoir vraiment ce que c'est, mais en appréciant juste ; la complicité sans égal venait aussi avec son lot de différences et de désaccords, ce qui a peut-être donné cet impression d'amour incompatible, mais très fusionnel.` },
  P6: { t: `L'indélébile`, d: `La rupture la plus profonde, soit récente donc douloureuse, soit ancienne et persistante. Pas besoin d'aller plus loin pour comprendre l'amour que c'était.` }
};

// o = points si Oui, n = points si Non, skip = condition de saut (s.a = réponses : 'o' | 'n' | 'm')
const Q = [
  { id: '1', t: `As-tu déjà beaucoup pensé à une personne pendant qu'elle faisait partie de ton quotidien ou était proche de toi ?`, o: {}, n: {} },
  { id: '2', t: `As-tu déjà pensé à une personne alors qu'il n'y avait pas de raison particulière de le faire ?`, o: { P1: 1, P4: 1, P6: 1 }, n: { P2: 1, P3: 1, P5: 1 } },
  { id: '3', t: `Ce genre de pensée est-il souvent déclenché par une chanson, une odeur ou un endroit ?`, o: { P1: 2, P4: 1, P6: 1 }, n: { P2: 1, P3: 1 } },
  { id: '4', t: `T'arrive-t-il de penser à des gens que tu ne vois plus du tout ?`, o: { P1: 1, P2: 1, P4: 1, P5: 1 }, n: { P3: 1 } },
  { id: '5', t: `Ces pensées te ramènent-elles souvent à l'époque où tu étais plus jeune ?`, o: { P1: 2, P2: 1, P4: 1 }, n: { P3: 1, P5: 1, P6: 1 } },
  { id: '6', t: `Cette période dont tu te souviens, c'était avant le bac ?`, o: { P1: 3, P4: 1, P5: 1 }, n: { P2: 1, P3: 1, P6: 1 } },
  { id: '7a', t: `Plutôt le collège que le lycée ?`, o: { P1: 3 }, n: { P1: 1, P2: 2, P3: 1, P5: 1 }, skip: s => s.a['6'] !== 'o' },
  { id: '7b', t: `C'était pendant tes études supérieures ?`, o: { P2: 3, P3: 1, P5: 1 }, n: { P3: 1, P6: 3 }, skip: s => s.a['6'] !== 'n' },
  { id: '8', t: `Ça se passait à Paris même, pas en banlieue ?`, o: {}, n: {} },
  { id: '9', t: s => s.a['8'] === 'n' ? `Plutôt côté ouest ou sud ?` : `Plutôt rive gauche ?`, o: {}, n: {} },
  { id: '10', t: s => {
      if (s.a['8'] === 'n') return `Dans une grande ville proche de Paris ?`;
      return s.a['9'] === 'n' ? `Plutôt dans l'Est (10e, 11e, 18e, 19e, 20e) ?` : `Autour du Quartier latin, du Luxembourg ou de Montparnasse (5e, 6e, 14e) ?`;
    }, o: {}, n: {} },
  { id: '11', t: `Ça tournait surtout dans ou autour de ton établissement (lycée, fac) ?`, o: { P1: 1, P4: 1, P5: 1 }, n: { P2: 1, P3: 1, P6: 1 } },
  { id: '12', t: `Entre vous, il s'est vraiment passé quelque chose (un « on est en couple ») ?`, o: { P1: 2, P2: 2, P3: 2, P5: 2, P6: 2 }, n: { P4: 6 } },
  { id: '13', t: `Ça a duré plus d'un an ?`, o: { P3: 5, P6: 3 }, n: { P1: 3, P2: 3, P5: 1 }, skip: s => s.a['12'] !== 'o' },
  { id: '13b', t: `Il y avait quelque chose d'évident entre vous, que personne n'a franchi ?`, o: { P4: 5, P5: 1 }, n: { P5: 2, P2: 1 }, skip: s => s.a['12'] === 'o' },
  { id: '14', t: `C'était très fusionnel, vous étiez tout le temps collés, presque trop ?`, o: { P1: 3, P5: 2, P2: 1 }, n: { P2: 3 }, skip: s => s.a['13'] !== 'n' },
  { id: '15', t: `Vous étiez très complices, mais avec des différences et des désaccords qui revenaient ?`, o: { P5: 5, P3: 1, P6: 1 }, n: { P1: 2, P2: 2, P4: 1 } },
  { id: '16', t: `Cette personne a-t-elle été ton premier vrai sentiment amoureux ?`, o: { P1: 4, P3: 3, P4: 1 }, n: { P2: 2, P5: 1, P6: 1 } },
  { id: '17', t: `La fin (ou l'absence de suite) reste-t-elle ce qui t'a le plus marqué émotionnellement dans ta vie ?`, o: { P6: 6, P3: 2 }, n: { P1: 1, P2: 1, P4: 1, P5: 1 } },
  { id: '18', t: `Ça s'est éteint sans vraie rupture, ça s'est juste arrêté ?`, o: { P2: 4, P1: 2, P5: 2 }, n: { P3: 2, P6: 2 }, skip: s => s.a['12'] === 'n' },
  { id: '19', t: `Il reste un côté beau mais inachevé, qui revient de temps en temps ?`, o: { P1: 4, P4: 3, P5: 1, P6: 1 }, n: { P2: 4, P3: 1 } },
  { id: '20', t: `Tu t'es déjà demandé « qu'est-ce que ça aurait pu donner ? »`, o: { P4: 4, P1: 1, P3: 1, P5: 1 }, n: { P2: 2, P6: 1 } },
  { id: '21', t: `C'était un renoi ?`, o: {}, n: {} },
  { id: '22', t: `Elle/il avait à peu près ton âge, à un ou deux ans près ?`, o: {}, n: {} },
  { id: '23', t: `C'était un asiat ?`, o: {}, n: {} },
  { id: '24', t: `C'était un rebeu ?`, o: {}, n: {} },
  { id: '25', t: `C'était un blanc ?`, o: {}, n: {}, skip: s => ['21', '23', '24'].some(q => s.a[q] === 'o') },
  { id: '26', t: `Vous êtes restés en contact après ?`, o: { P4: 1, P5: 1 }, n: { P1: 1, P6: 1 } }
];

// Questions de correction (reposées uniquement si elles n'ont pas encore été posées)
const CORR = { P1: ['19', '16'], P2: ['18', '14'], P3: ['13', '17'], P4: ['13b', '20'], P5: ['15', '14'], P6: ['17', '20'] };
