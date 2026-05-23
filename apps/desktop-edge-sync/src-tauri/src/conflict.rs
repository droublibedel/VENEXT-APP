#[derive(Debug, Clone, Copy)]
pub enum ResolutionStrategy {
    ServerWins,
    ClientWins,
    MergeFieldwise,
    DeferToOperator,
}

pub fn pick_strategy(entity_kind: &str) -> ResolutionStrategy {
    match entity_kind {
        "WALLET_LEDGER_CACHE" => ResolutionStrategy::ServerWins,
        "ORDER_DRAFT" => ResolutionStrategy::MergeFieldwise,
        _ => ResolutionStrategy::DeferToOperator,
    }
}
