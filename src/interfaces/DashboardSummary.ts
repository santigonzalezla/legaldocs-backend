export interface DashboardSummary
{
    documents: {
        month:    number;
        total:    number;
        deltaPct: number | null;
    };
    billableHours: {
        month:        number;
        trackedMonth: number;
        deltaPct:     number | null;
    };
    processes: {
        active:       number;
        inReview:     number;
        newThisMonth: number;
    };
    clients: {
        active:         number;
        newThisMonth:   number;
        newCompanies:   number;
        newIndividuals: number;
    };
}
