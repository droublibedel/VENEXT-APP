import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:venext_mobile/features/profile/commercial_id_profile_section.dart';

void main() {
  testWidgets('copy button appears in mobile profile contract', (tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: CommercialIdProfileSection(
            commercialId: '4829173056',
            locale: 'en',
          ),
        ),
      ),
    );

    expect(find.byKey(const Key('venext_commercial_id_copy')), findsOneWidget);
  });
}
