import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Profile row: public commercial identifier + copy (system clipboard).
/// Contract: copy control must use [Key] `venext_commercial_id_copy`.
class CommercialIdProfileSection extends StatelessWidget {
  const CommercialIdProfileSection({
    super.key,
    required this.commercialId,
    this.locale = 'en',
  });

  final String commercialId;
  final String locale;

  String get _label => locale == 'fr' ? 'Identifiant VENEXT' : 'VENEXT ID';

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: _label,
      child: Card(
        margin: const EdgeInsets.symmetric(vertical: 8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      letterSpacing: 0.8,
                      fontWeight: FontWeight.w600,
                    ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: SelectableText(
                      commercialId,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontFamily: 'monospace',
                            letterSpacing: 1.2,
                          ),
                    ),
                  ),
                  IconButton(
                    key: const Key('venext_commercial_id_copy'),
                    tooltip: locale == 'fr' ? 'Copier' : 'Copy',
                    icon: const Icon(Icons.copy_outlined),
                    onPressed: () async {
                      await Clipboard.setData(ClipboardData(text: commercialId));
                      if (!context.mounted) return;
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            locale == 'fr' ? 'Identifiant copié' : 'ID copied',
                          ),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
