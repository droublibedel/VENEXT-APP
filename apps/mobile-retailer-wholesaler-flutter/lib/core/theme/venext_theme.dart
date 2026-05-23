import 'package:flutter/material.dart';

/// Custom surfaces — not a generic component library; tuned for dense commerce UI.
ThemeData venextTheme(Brightness brightness) {
  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    visualDensity: VisualDensity.compact,
  );
  final color = ColorScheme.fromSeed(
    seedColor: const Color(0xFF1C6BFF),
    brightness: brightness,
  );
  return base.copyWith(
    colorScheme: color,
    scaffoldBackgroundColor:
        brightness == Brightness.dark ? const Color(0xFF0B1220) : const Color(0xFFF6F7F9),
  );
}
