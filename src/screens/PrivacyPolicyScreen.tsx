import React from 'react';
import { ScrollView, Text, StyleSheet, useColorScheme, Linking } from 'react-native';

export default function PrivacyPolicyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isDark ? '#000' : '#fff' }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: isDark ? '#fff' : '#000' }]}>
        Privacy Policy
      </Text>
      <Text style={[styles.updated, { color: isDark ? '#8E8E93' : '#666' }]}>
        Last updated: February 2, 2026
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Overview
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        GameFAQs Reader is an open source application that does not collect, store, or transmit any personal data.
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Data Collection
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        This app does not collect:{'\n'}
        • Personal information{'\n'}
        • Usage analytics{'\n'}
        • Location data{'\n'}
        • Device identifiers{'\n'}
        • Any form of tracking data
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Local Storage
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        The app stores data locally on your device only:{'\n'}
        • Downloaded guides for offline reading{'\n'}
        • Bookmarks and reading positions{'\n'}
        • App preferences (server URL, display settings){'\n\n'}
        This data never leaves your device unless you explicitly connect to a self-hosted server that you control.
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Server Connection
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        If you configure a server URL, the app communicates only with that server to fetch guide content. No data is sent to any third-party services.
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Open Source
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        This application is open source under the MIT License. You can review the complete source code at:{' '}
        <Text
          style={styles.link}
          onPress={() => Linking.openURL('https://github.com/Danondso/gamefaqs-reader')}
        >
          github.com/Danondso/gamefaqs-reader
        </Text>
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        No Warranty
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        This software is provided "as is", without warranty of any kind, express or implied. See the MIT License for full terms.
      </Text>

      <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
        Contact
      </Text>
      <Text style={[styles.paragraph, { color: isDark ? '#ccc' : '#333' }]}>
        For questions about this privacy policy, please open an issue on the GitHub repository.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  updated: {
    fontSize: 14,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
  },
  link: {
    color: '#3366CC',
    textDecorationLine: 'underline',
  },
});
