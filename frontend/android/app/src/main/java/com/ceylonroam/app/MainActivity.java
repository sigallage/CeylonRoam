package com.ceylonroam.app;

import android.os.Build;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		if (getBridge() == null) return;
		WebView webView = getBridge().getWebView();
		if (webView == null) return;

		if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
			WebSettings settings = webView.getSettings();
			if (settings != null) {
				settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
			}
		}
	}
}
