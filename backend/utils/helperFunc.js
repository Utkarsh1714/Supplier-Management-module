export const parseFilters = (filters) => {
    if (!filters) return [];
    if (typeof filters === 'string') {
        return filters.split(',').map(f => f.trim()).filter(f => f);
    }
    return Array.isArray(filters) ? filters : [];
}

export const buildSupplierFilterClause = (filters) => {
    const conditions = [];

    if (filters.includes('inactive')) {
        conditions.push('s.is_active IS FALSE');
        conditions.push('s.deleted_at IS NOT NULL');
    } else {
        conditions.push('s.is_active IS TRUE');
        conditions.push('s.deleted_at IS NULL');
    }

    if (filters.includes('msme_registered')) {
        conditions.push('s.is_msme_registered IS TRUE');
    }

    if (filters.includes('not_msme_registered')) {
        conditions.push('s.is_msme_registered IS FALSE');
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
}

export const buildAddressFilterClause = (filters) => {
    const conditions = [];

    if (filters.includes('primary')) {
        conditions.push('is_primary IS TRUE')
    }
    if (filters.includes('shipping')) {
        conditions.push("type = 'shipping'");
    }
    if (filters.includes('billing')) {
        conditions.push("type = 'billing'");
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : "";
}