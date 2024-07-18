export function extractColumns(dataFrame) {
    const columns = {};
    for (const field of dataFrame.schema.fields) {
      columns[field.name] = [];
    }
    for (const batch of dataFrame.batches) {
      for (const field of dataFrame.schema.fields) {
        const tempColumn = batch.getChild(field.name);
        for (let i = 0; i < tempColumn.length; i++) {
          columns[field.name].push(tempColumn.get(i));
        }
      }
    }
    return columns;
  }