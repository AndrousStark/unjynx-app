import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';

import '../domain/models/subscription.dart';

/// Product IDs matching App Store / Play Store configuration.
abstract final class ProductIds {
  static const proMonthly = 'unjynx_pro_monthly';
  static const proAnnual = 'unjynx_pro_annual';
  static const teamMonthly = 'unjynx_team_monthly';
  static const teamAnnual = 'unjynx_team_annual';
  static const familyMonthly = 'unjynx_family_monthly';

  static const all = {
    proMonthly,
    proAnnual,
    teamMonthly,
    teamAnnual,
    familyMonthly,
  };
}

/// Result of a purchase operation.
@immutable
class PurchaseResult {
  final bool success;
  final String? errorMessage;
  final Subscription subscription;

  const PurchaseResult({
    required this.success,
    this.errorMessage,
    required this.subscription,
  });

  const PurchaseResult.ok(this.subscription)
      : success = true,
        errorMessage = null;

  const PurchaseResult.error(this.errorMessage)
      : success = false,
        subscription = Subscription.free;
}

/// In-app purchase manager using the official Flutter `in_app_purchase` plugin.
///
/// Wraps StoreKit (iOS) and Google Play Billing (Android) behind a single API.
/// During alpha, the backend ALPHA_MODE bypass means all features are free;
/// real purchases still flow through the store for receipt validation.
class PurchaseManager {
  PurchaseManager._();

  static final _instance = PurchaseManager._();
  static PurchaseManager get instance => _instance;

  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _purchaseSubscription;
  final _purchaseCompleter = <String, Completer<PurchaseResult>>{};

  bool _initialized = false;
  bool _storeAvailable = false;
  List<ProductDetails> _products = const [];
  Subscription _currentSubscription = Subscription.free;

  /// Whether the manager has been initialized.
  bool get isInitialized => _initialized;

  /// Whether the store is available on this device.
  bool get isStoreAvailable => _storeAvailable;

  /// Cached product details from the store.
  List<ProductDetails> get products => List.unmodifiable(_products);

  /// Current subscription (from last known state).
  Subscription get currentSubscription => _currentSubscription;

  /// Callback for backend receipt verification.
  /// Set this from the billing providers so the manager can call the API.
  Future<Subscription> Function(String receipt, String productId)?
      onVerifyReceipt;

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  /// Initialize the purchase manager, query the store for products,
  /// and begin listening for purchase updates.
  Future<void> initialize() async {
    if (_initialized) return;

    _storeAvailable = await _iap.isAvailable();
    if (!_storeAvailable) {
      debugPrint('PurchaseManager: store not available');
      _initialized = true;
      return;
    }

    // Listen to purchase stream
    _purchaseSubscription = _iap.purchaseStream.listen(
      _handlePurchaseUpdates,
      onError: (Object error) {
        debugPrint('PurchaseManager: purchase stream error: $error');
      },
    );

    // Load products
    await _loadProducts();

    _initialized = true;
    debugPrint('PurchaseManager: initialized with ${_products.length} products');
  }

  /// Dispose of the purchase stream subscription.
  Future<void> dispose() async {
    await _purchaseSubscription?.cancel();
    _purchaseSubscription = null;
    _initialized = false;
  }

  // ---------------------------------------------------------------------------
  // Product queries
  // ---------------------------------------------------------------------------

  /// Reload product details from the store.
  Future<void> _loadProducts() async {
    final response = await _iap.queryProductDetails(ProductIds.all);

    if (response.notFoundIDs.isNotEmpty) {
      debugPrint(
        'PurchaseManager: products not found: ${response.notFoundIDs}',
      );
    }
    if (response.error != null) {
      debugPrint(
        'PurchaseManager: query error: ${response.error!.message}',
      );
    }

    _products = response.productDetails;
  }

  /// Get a specific product by its ID.
  ProductDetails? getProduct(String productId) {
    try {
      return _products.firstWhere((p) => p.id == productId);
    } on StateError {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Purchases
  // ---------------------------------------------------------------------------

  /// Initiate a purchase for the given product ID.
  ///
  /// Returns a [PurchaseResult] once the store confirms or rejects the
  /// transaction. The receipt is verified server-side via [onVerifyReceipt].
  Future<PurchaseResult> purchase(String productId) async {
    if (!_storeAvailable) {
      return const PurchaseResult.error('Store not available on this device');
    }

    final product = getProduct(productId);
    if (product == null) {
      return PurchaseResult.error('Product "$productId" not found in store');
    }

    final purchaseParam = PurchaseParam(productDetails: product);
    final completer = Completer<PurchaseResult>();
    _purchaseCompleter[productId] = completer;

    try {
      final started = await _iap.buyNonConsumable(
        purchaseParam: purchaseParam,
      );

      if (!started) {
        _purchaseCompleter.remove(productId);
        return const PurchaseResult.error('Failed to initiate purchase');
      }

      return completer.future;
    } on Exception catch (e) {
      _purchaseCompleter.remove(productId);
      return PurchaseResult.error('Purchase error: $e');
    }
  }

  /// Restore past purchases (useful after reinstall or new device).
  Future<PurchaseResult> restorePurchases() async {
    if (!_storeAvailable) {
      return const PurchaseResult.error('Store not available');
    }

    try {
      await _iap.restorePurchases();
      // The restored purchases will flow through _handlePurchaseUpdates.
      // Return the current subscription after a brief wait.
      await Future<void>.delayed(const Duration(seconds: 2));
      return PurchaseResult.ok(_currentSubscription);
    } on Exception catch (e) {
      return PurchaseResult.error('Restore failed: $e');
    }
  }

  // ---------------------------------------------------------------------------
  // Purchase stream handler
  // ---------------------------------------------------------------------------

  Future<void> _handlePurchaseUpdates(
    List<PurchaseDetails> purchaseDetailsList,
  ) async {
    for (final purchase in purchaseDetailsList) {
      switch (purchase.status) {
        case PurchaseStatus.pending:
          debugPrint('PurchaseManager: pending - ${purchase.productID}');

        case PurchaseStatus.purchased:
        case PurchaseStatus.restored:
          await _verifyAndDeliver(purchase);

        case PurchaseStatus.error:
          debugPrint(
            'PurchaseManager: error - ${purchase.error?.message}',
          );
          _completePurchase(
            purchase.productID,
            PurchaseResult.error(
              purchase.error?.message ?? 'Unknown purchase error',
            ),
          );

        case PurchaseStatus.canceled:
          debugPrint('PurchaseManager: canceled - ${purchase.productID}');
          _completePurchase(
            purchase.productID,
            const PurchaseResult.error('Purchase canceled by user'),
          );
      }

      // Complete the transaction with the store
      if (purchase.pendingCompletePurchase) {
        await _iap.completePurchase(purchase);
      }
    }
  }

  Future<void> _verifyAndDeliver(PurchaseDetails purchase) async {
    // Extract receipt data for server verification
    final receipt = purchase.verificationData.serverVerificationData;

    if (onVerifyReceipt != null) {
      try {
        final subscription = await onVerifyReceipt!(
          receipt,
          purchase.productID,
        );
        _currentSubscription = subscription;
        _completePurchase(purchase.productID, PurchaseResult.ok(subscription));
        return;
      } on Exception catch (e) {
        debugPrint('PurchaseManager: verification error: $e');
        // Fall through to local mapping
      }
    }

    // Local fallback: map product ID to subscription (for alpha / offline)
    _currentSubscription = _subscriptionFromProductId(purchase.productID);
    _completePurchase(
      purchase.productID,
      PurchaseResult.ok(_currentSubscription),
    );
  }

  void _completePurchase(String productId, PurchaseResult result) {
    _purchaseCompleter.remove(productId)?.complete(result);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /// Maps a store product ID to a [Subscription] (local fallback).
  static Subscription _subscriptionFromProductId(String productId) {
    return switch (productId) {
      ProductIds.proMonthly => const Subscription(
          plan: PlanType.pro,
          status: SubscriptionStatus.active,
          period: BillingPeriod.monthly,
        ),
      ProductIds.proAnnual => const Subscription(
          plan: PlanType.pro,
          status: SubscriptionStatus.active,
          period: BillingPeriod.annual,
        ),
      ProductIds.teamMonthly => const Subscription(
          plan: PlanType.team,
          status: SubscriptionStatus.active,
          period: BillingPeriod.monthly,
        ),
      ProductIds.teamAnnual => const Subscription(
          plan: PlanType.team,
          status: SubscriptionStatus.active,
          period: BillingPeriod.annual,
        ),
      ProductIds.familyMonthly => const Subscription(
          plan: PlanType.family,
          status: SubscriptionStatus.active,
          period: BillingPeriod.monthly,
        ),
      _ => Subscription.free,
    };
  }
}
