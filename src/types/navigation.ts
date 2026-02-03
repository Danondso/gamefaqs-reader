export type RootTabParamList = {
  Library: undefined;
  Downloads: undefined;
  Reader: { guideId: string } | undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  HomeTabs: undefined;
  GuideReader: { guideId: string };
  PrivacyPolicy: undefined;
};
