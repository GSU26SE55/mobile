package __ANDROID_PACKAGE__.notifications

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import expo.modules.ReactActivityDelegateWrapper
import __ANDROID_PACKAGE__.BuildConfig

/** Hosts the shared in-app chat UI in an isolated React surface for the system bubble task. */
class ChatBubbleActivity : ReactActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    // A document/bubble task must never restore a React surface id from an old task.
    // MainActivity follows the same rule; restoring it is what produced the blank white surface.
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "bubble"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle = Bundle().apply {
          val source = this@ChatBubbleActivity.intent
          putString(
            ChatBubbleNotifier.EXTRA_TICKET_ID,
            source.getStringExtra(ChatBubbleNotifier.EXTRA_TICKET_ID)
              ?: source.data?.getQueryParameter("ticketId"),
          )
          putString(
            ChatBubbleNotifier.EXTRA_NOTIFICATION_ID,
            source.getStringExtra(ChatBubbleNotifier.EXTRA_NOTIFICATION_ID)
              ?: source.data?.getQueryParameter("notificationId"),
          )
        }
      },
    )
}
