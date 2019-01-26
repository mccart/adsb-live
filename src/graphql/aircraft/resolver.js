const Database = require("better-sqlite3");
const uuid = require("uuid/v4");
const _ = require("lodash");
const bs = new Database("./data/db/BaseStation.sqb");
const sd = new Database("./data/db/StandingData.sqb");

let countries = sd.prepare(`SELECT name FROM Country ORDER BY name`);
countries.pluck();

let codeBlocks = sd.prepare(
  `Select Country, BitMask, SignificantBitMask, IsMilitary from CodeBlockView`
);
function toDate(v) {
  return `date(${v})`;
}
const fieldOverrides = {
  Engines: parseInt,
  FirstCreated: toDate,
  LastModified: toDate
};
function normalize(field, v) {
  let func = fieldOverrides[field];
  return func ? func(v) : v;
}
function toQuery({ query, options = {} }) {
  let sql = "";
  let values = undefined;
  if (query) {
    let where = toWhere(query);
    sql += where[0];
    values = where[1];
  }
  const { skip, take, sort } = options;
  if (sort && sort.length > 0) sql += toSort(sort);
  if (skip !== undefined || take !== undefined) sql += toLimit(skip, take);
  return [sql, values];
}
function toWhere(opts) {
  let [clause, values] = getQueryTerm(opts, []);
  return clause === "" ? ["", []] : [`WHERE ${clause}`, values];
}
function getQueryTerm(clause, allValues) {
  let { and, or, not, op, field, values } = clause;
  if (and) {
    return toAnd(and, allValues);
  } else if (or) {
    return toOr(or, allValues);
  } else if (not) {
    return [`(${toNot(not)})`, allValues];
  } else {
    switch (op) {
      case "in":
        return values.length
          ? [`(${toIn(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "exists":
        return values.length
          ? [`(${toHas(field)})`, allValues]
          : ["", allValues];
      case "startsWith":
        values = values.map(v => `${v}%`);
        return values.length
          ? [`(${toLike(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "endsWith":
        values = values.map(v => `%${v}`);
        return values.length
          ? [`(${toLike(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "contains":
        values = values.map(v => `%${v}%`);
        return values.length
          ? [`(${toLike(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "eq":
        return values.length
          ? [`(${toEq(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "gt":
        return values.length
          ? [`(${toGt(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "gte":
        return values.length
          ? [`(${toGte(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "lt":
        return values.length
          ? [`(${toLt(field, values)})`, allValues.concat(values)]
          : ["", allValues];
      case "lte":
        return values.length
          ? [`(${toLte(field, values)})`, allValues.concat(values)]
          : ["", allValues];
    }
  }
}
function toAnd(terms, values) {
  let [allTerms, allValues] = terms.reduce(
    ([allTerms, allValues], term) => {
      let [t, v] = getQueryTerm(term, allValues);
      allTerms.push(t);
      return [allTerms, v];
    },
    [[], values]
  );
  return [allTerms.join(" AND "), allValues];
}
function toOr(terms, values) {
  let [allTerms, allValues] = terms.reduce(
    ([allTerms, allValues], term) => {
      let [t, v] = getQueryTerm(term, allValues);
      allTerms.push(t);
      return [allTerms, v];
    },
    [[], values]
  );
  return [allTerms.join(" OR "), allValues];
}
function toNot(terms, allValues) {
  return `NOT ${getQueryTerm(term, allValues)}`;
}
function toIn(field, terms) {
  terms = terms.map(t => "?");
  return `${field} IN (${terms.join(",")})`;
}
function toHas(field) {
  return `${field} IS NOT NULL`;
}
function toLike(field, terms) {
  terms = terms.map(t => `${field} LIKE ?`);
  return terms.join(" OR ");
}
function toEq(field, terms) {
  terms = terms.map(t => `${field} = ${normalize(field, "?")}`);
  return terms.join(" OR ");
}
function toGt(field, terms) {
  terms = terms.map(t => `${field} > ${normalize(field, "?")}`);
  return terms.join(" OR ");
}
function toGte(field, terms) {
  terms = terms.map(t => `${field} >= ${normalize(field, "?")}`);
  return terms.join(" OR ");
}
function toLt(field, terms) {
  terms = terms.map(t => `${field} < ${normalize(field, "?")}`);
  return terms.join(" OR ");
}
function toLte(field, terms) {
  terms = terms.map(t => `${field} <= ${normalize(field, "?")}`);
  return terms.join(" OR ");
}
function toLimit(skip, take) {
  let limit = "";
  if (take) limit += ` LIMIT ${take}`;
  if (skip) limit += ` OFFSET ${skip}`;
  return limit;
}
function toSort(opts) {
  let order = opts
    .map(({ field, direction }) => `${field} ${direction}`)
    .join(",");
  return ` ORDER BY ${order}`;
}

export const resolver = {
  Query: {
    aircraft(root, query, context) {
      let [terms, values] = toQuery(query);
      const stmt = bs.prepare(`SELECT * FROM Aircraft ${terms}`);
      return values && values.length > 0 ? stmt.all(values) : stmt.all();
    },
    aircraftCount(root, query, context) {
      let [terms, values] = toQuery(query);
      console.log(terms, values);
      const stmt = bs.prepare(`SELECT COUNT(*) FROM Aircraft ${terms}`);
      console.log(stmt);
      console.log(stmt.all(values));
      return (values && values.length > 0 ? stmt.all(values) : stmt.all())[0][
        "COUNT(*)"
      ];
    },
    aircraftTypes(root, query, context) {
      let [terms, values] = toQuery(query);
      const stmt = sd.prepare(`SELECT * FROM AircraftTypeView ${terms}`);
      return values && values.length > 0 ? stmt.all(values) : stmt.all();
    },
    countries() {
      return countries.all();
    },
    codeBlocks() {
      return codeBlocks.all();
    }
  }
};
