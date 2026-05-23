import 'package:flutter/material.dart';

import 'commercial_id_profile_section.dart';

/// Demo profile — production would load [commercialId] from org state / API.
class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final locale = Localizations.localeOf(context).languageCode;
    return Scaffold(
      appBar: AppBar(title: const Text('Profile')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(
            'Organization',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          CommercialIdProfileSection(
            commercialId: '4829173056',
            locale: locale == 'fr' ? 'fr' : 'en',
          ),
        ],
      ),
    );
  }
}
