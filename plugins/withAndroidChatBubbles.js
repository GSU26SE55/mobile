const fs = require('fs');
const path = require('path');
const {
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
  withMainApplication,
} = require('expo/config-plugins');

const OLD_BUBBLE_MESSAGING_SERVICE = '.notifications.ChatBubbleMessagingService';
const OLD_EXPO_MESSAGING_SERVICE = 'expo.modules.notifications.service.ExpoFirebaseMessagingService';
const BUBBLE_ACTIVITY = '.notifications.ChatBubbleActivity';

function withBubbleManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application?.[0];
    if (!application) return mod;

    application.service = (application.service ?? []).filter(
      (service) =>
        service.$?.['android:name'] !== OLD_BUBBLE_MESSAGING_SERVICE &&
        service.$?.['android:name'] !== OLD_EXPO_MESSAGING_SERVICE,
    );
    application['meta-data'] = (application['meta-data'] ?? []).filter(
      (entry) =>
        !entry.$?.['android:name']?.startsWith('com.google.firebase.messaging.default_notification_'),
    );

    application.activity = application.activity ?? [];
    const bubbleActivityAttributes = {
      'android:name': BUBBLE_ACTIVITY,
      'android:allowEmbedded': 'true',
      'android:documentLaunchMode': 'always',
      'android:excludeFromRecents': 'true',
      'android:exported': 'false',
      'android:launchMode': 'standard',
      'android:resizeableActivity': 'true',
      'android:windowSoftInputMode': 'adjustResize',
      'android:taskAffinity': '',
      'android:theme': '@style/AppTheme',
    };
    const bubbleActivity = application.activity.find(
      (activity) => activity.$?.['android:name'] === BUBBLE_ACTIVITY,
    );
    if (bubbleActivity) {
      // Prebuild is incremental unless --clean is used. Keep an existing activity
      // in sync too, otherwise newly-added attributes never reach AndroidManifest.
      bubbleActivity.$ = { ...bubbleActivity.$, ...bubbleActivityAttributes };
    } else {
      application.activity.push({ $: bubbleActivityAttributes });
    }

    return mod;
  });
}

function withoutOldFirebaseDependency(config) {
  return withAppBuildGradle(config, (mod) => {
    mod.modResults.contents = mod.modResults.contents.replace(
      /^\s*implementation\("com\.google\.firebase:firebase-messaging:[^\n]+\)\s*$/gm,
      '',
    );
    return mod;
  });
}

function withBubbleSources(config) {
  return withDangerousMod(config, [
    'android',
    async (mod) => {
      const packageName = mod.android?.package;
      if (!packageName) throw new Error('android.package is required for chat bubbles');

      const targetDir = path.join(
        mod.modRequest.platformProjectRoot,
        'app',
        'src',
        'main',
        'java',
        ...packageName.split('.'),
        'notifications',
      );
      const sourceDir = path.join(mod.modRequest.projectRoot, 'plugins', 'android-chat-bubbles');

      fs.mkdirSync(targetDir, { recursive: true });
      for (const file of [
        'ChatBubbleActivity.kt',
        'ChatBubbleModule.kt',
        'ChatBubbleNotifier.kt',
        'ChatBubblePackage.kt',
      ]) {
        const source = fs
          .readFileSync(path.join(sourceDir, file), 'utf8')
          .replaceAll('__ANDROID_PACKAGE__', packageName);
        fs.writeFileSync(path.join(targetDir, file), source);
      }

      const obsoleteService = path.join(targetDir, 'ChatBubbleMessagingService.kt');
      if (fs.existsSync(obsoleteService)) fs.unlinkSync(obsoleteService);
      const obsoleteApi = path.join(targetDir, 'ChatBubbleApi.kt');
      if (fs.existsSync(obsoleteApi)) fs.unlinkSync(obsoleteApi);

      return mod;
    },
  ]);
}

function withBubblePackage(config) {
  return withMainApplication(config, (mod) => {
    if (mod.modResults.language !== 'kt') {
      throw new Error('withAndroidChatBubbles currently requires a Kotlin MainApplication');
    }

    const packageName = config.android?.package;
    if (!packageName) throw new Error('android.package is required for chat bubbles');

    let source = mod.modResults.contents;
    const importLine = `import ${packageName}.notifications.ChatBubblePackage`;
    if (!source.includes(importLine)) {
      source = source.replace('import com.facebook.react.PackageList', `${importLine}\n\nimport com.facebook.react.PackageList`);
    }
    if (!source.includes('add(ChatBubblePackage())')) {
      source = source.replace(
        'PackageList(this).packages.apply {',
        'PackageList(this).packages.apply {\n              add(ChatBubblePackage())',
      );
    }
    mod.modResults.contents = source;
    return mod;
  });
}

module.exports = function withAndroidChatBubbles(config) {
  return withBubblePackage(
    withBubbleSources(withoutOldFirebaseDependency(withBubbleManifest(config))),
  );
};
