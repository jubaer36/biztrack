# DataMapper Enhanced Logging Guide

## Overview

The DataMapper now includes comprehensive logging for both backend console and frontend real-time updates.

## Features

### 🎯 Structured Logging Levels

- **`info`** ℹ️ - General information messages
- **`success`** ✅ - Successful operations
- **`warning`** ⚠️ - Warnings and fallbacks
- **`error`** ❌ - Errors and failures
- **`progress`** 🔄 - Progress updates
- **`data`** 📊 - Data summaries and statistics

### 📊 Progress Tracking

The DataMapper tracks:
- **Stage**: Current phase (e.g., "Initialization", "Collection 1/3")
- **Step**: Specific operation (e.g., "Analyzing structure")
- **Percentage**: 0-100% completion
- **Details**: Contextual information
- **Logs**: Array of all log entries

## Backend Console Output

### Example Output

```bash
═══════════════════════════════════════════════════════════════════════════════
ℹ️ [INFO] DATA TRANSFORMATION PIPELINE STARTED
   Details: {
     "businessId": "298e5a35-0a91-452a-acb8-403cc150bc16",
     "timestamp": "2025-11-05T15:30:00.000Z"
   }
═══════════════════════════════════════════════════════════════════════════════

✅ [SUCCESS] Found 3 collections to process
   Details: {
     "collections": [
       "298e5a35-0a91-452a-acb8-403cc150bc16_Products",
       "298e5a35-0a91-452a-acb8-403cc150bc16_Books",
       "298e5a35-0a91-452a-acb8-403cc150bc16_Shareholders_info"
     ]
   }

───────────────────────────────────────────────────────────────────────────────
ℹ️ [INFO] PROCESSING COLLECTION 1/3
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products",
     "progress": "1/3"
   }
───────────────────────────────────────────────────────────────────────────────

🔄 [PROGRESS] Collection 1/3: Step 1/3: Analyzing structure
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products"
   }

ℹ️ [INFO] Starting analysis of collection: 298e5a35-0a91-452a-acb8-403cc150bc16_Products

🔄 [PROGRESS] Fetching sample documents...
   Details: {
     "collectionName": "298e5a35-0a91-452a-acb8-403cc150bc16_Products"
   }

📊 [DATA] Found 9 total documents

✅ [SUCCESS] Retrieved 5 sample documents

🔄 [PROGRESS] Analyzing field structure...

✅ [SUCCESS] Field analysis complete
   Details: {
     "totalFields": 17,
     "cashFlowRelatedFields": 6,
     "fields": [...]
   }

📊 [DATA] Analysis Summary
   Details: {
     "documents": 9,
     "fields": 17,
     "cashFlowFields": 6
   }

🔄 [PROGRESS] Collection 1/3: Step 2/3: Determining mappings with LLM
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products"
   }

ℹ️ [INFO] Starting LLM table mapping analysis

🔄 [PROGRESS] Querying LLM for table mapping
   Details: {
     "model": "openai/gpt-oss-120b",
     "attempt": 1,
     "maxRetries": 2
   }

✅ [SUCCESS] LLM response received in 1245ms

🔄 [PROGRESS] Parsing LLM response...

✅ [SUCCESS] Table mapping determined successfully
   Details: {
     "model": "openai/gpt-oss-120b",
     "responseTime": "1245ms",
     "tablesDetected": 2,
     "tables": [
       { "name": "product", "confidence": 0.92, "fieldMappings": 8 },
       { "name": "purchase_order_items", "confidence": 0.85, "fieldMappings": 6 }
     ],
     "unmappedFields": 3
   }

📊 [DATA] Mapping Summary
   Details: {
     "targetTables": "product, purchase_order_items",
     "tablesCount": 2,
     "unmappedFields": 3
   }

🔄 [PROGRESS] Collection 1/3: Step 3/3: Migrating data to database
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products"
   }

ℹ️ [INFO] Starting data migration to Supabase
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products",
     "businessId": "298e5a35-0a91-452a-acb8-403cc150bc16",
     "targetTables": 2
   }

🔄 [PROGRESS] Loading documents from MongoDB...

✅ [SUCCESS] Loaded 9 documents from MongoDB

ℹ️ [INFO] Processing table 1/2: product
   Details: {
     "tableName": "product",
     "fieldMappings": 8,
     "confidence": 0.92
   }

🔄 [PROGRESS] Transforming documents...

✅ [SUCCESS] Transformed 9/9 documents

🔄 [PROGRESS] Validating and deduplicating records...

✅ [SUCCESS] Validation complete
   Details: {
     "totalRecords": 9,
     "cleanRecords": 9,
     "duplicatesRemoved": 0,
     "validationRate": "100.0%"
   }

ℹ️ [INFO] Inserting 9 records in 1 batches

🔄 [PROGRESS] Inserting batch 1/1...
   Details: {
     "batchSize": 9,
     "table": "product"
   }

✅ [SUCCESS] Batch 1/1 inserted successfully
   Details: {
     "recordsInserted": 9,
     "totalInserted": 9
   }

✅ [SUCCESS] Table product migration completed
   Details: {
     "inserted": 9,
     "total": 9,
     "successRate": "100.0%",
     "errors": 0
   }

✅ [SUCCESS] Collection processed successfully in 3.45s
   Details: {
     "collection": "298e5a35-0a91-452a-acb8-403cc150bc16_Products",
     "recordsInserted": 15,
     "totalRecords": 9,
     "insertionRate": "166.7%",
     "processingTime": "3.45s"
   }

═══════════════════════════════════════════════════════════════════════════════
✅ [SUCCESS] TRANSFORMATION PIPELINE COMPLETE
   Details: {
     "totalTime": "12.34s",
     "collectionsProcessed": 3,
     "collectionsFailed": 0,
     "totalCollections": 3,
     "recordsProcessed": 25,
     "recordsInserted": 23,
     "successRate": "92.0%"
   }
═══════════════════════════════════════════════════════════════════════════════
```

## API Endpoints

### 1. Standard POST Request

```bash
POST /api/data/map/:businessId
```

**Response:**
```json
{
  "success": true,
  "message": "Data mapping completed successfully",
  "businessId": "uuid",
  "businessName": "My Business",
  "result": {
    "businessId": "uuid",
    "totalCollections": 3,
    "processedCollections": 3,
    "failedCollections": 0,
    "totalRecordsProcessed": 25,
    "totalRecordsInserted": 23,
    "successRate": "92.0",
    "processingTime": "12.34",
    "results": [...],
    "logs": [
      {
        "timestamp": "2025-11-05T15:30:00.000Z",
        "level": "info",
        "message": "Starting analysis...",
        "details": {}
      }
    ]
  }
}
```

### 2. Server-Sent Events (SSE) Stream

```bash
GET /api/data/map/:businessId/stream
```

**Real-time Updates:**

```javascript
// Frontend code
const eventSource = new EventSource('/api/data/map/business-id/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'connected':
      console.log('Connected:', data.message);
      break;
      
    case 'progress':
      // Update UI with progress
      console.log(`${data.stage}: ${data.step} (${data.percentage}%)`);
      console.log('Latest log:', data.currentLog);
      break;
      
    case 'complete':
      console.log('Complete:', data.result);
      eventSource.close();
      break;
      
    case 'error':
      console.error('Error:', data.error);
      eventSource.close();
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE Error:', error);
  eventSource.close();
};
```

## Frontend Integration Example

### React Component

```jsx
import React, { useState, useEffect } from 'react';

function DataMappingProgress({ businessId }) {
  const [progress, setProgress] = useState({
    stage: '',
    step: '',
    percentage: 0,
    logs: []
  });
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource(
      `/api/data/map/${businessId}/stream`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'progress') {
        setProgress({
          stage: data.stage,
          step: data.step,
          percentage: data.percentage,
          logs: data.logs || []
        });
      } else if (data.type === 'complete') {
        setIsComplete(true);
        eventSource.close();
      }
    };

    return () => eventSource.close();
  }, [businessId]);

  return (
    <div className="mapping-progress">
      <h2>Data Mapping Progress</h2>
      
      {/* Progress Bar */}
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      
      {/* Current Status */}
      <div className="current-status">
        <h3>{progress.stage}</h3>
        <p>{progress.step}</p>
        <span>{progress.percentage.toFixed(1)}%</span>
      </div>
      
      {/* Log Stream */}
      <div className="log-stream">
        {progress.logs.slice(-10).map((log, idx) => (
          <div key={idx} className={`log-entry log-${log.level}`}>
            <span className="log-level">{log.level}</span>
            <span className="log-message">{log.message}</span>
            {Object.keys(log.details).length > 0 && (
              <details>
                <summary>Details</summary>
                <pre>{JSON.stringify(log.details, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>
      
      {isComplete && (
        <div className="completion-message">
          ✅ Mapping completed successfully!
        </div>
      )}
    </div>
  );
}
```

### CSS Styling

```css
.mapping-progress {
  padding: 20px;
  font-family: monospace;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
  margin: 20px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #45a049);
  transition: width 0.3s ease;
}

.current-status {
  margin: 20px 0;
  padding: 15px;
  background: #f5f5f5;
  border-left: 4px solid #2196F3;
}

.log-stream {
  max-height: 400px;
  overflow-y: auto;
  background: #1e1e1e;
  color: #fff;
  padding: 10px;
  border-radius: 5px;
  font-size: 12px;
}

.log-entry {
  padding: 5px;
  margin: 2px 0;
  border-left: 3px solid transparent;
}

.log-info { border-left-color: #2196F3; }
.log-success { border-left-color: #4CAF50; }
.log-warning { border-left-color: #FF9800; }
.log-error { border-left-color: #f44336; }
.log-progress { border-left-color: #9C27B0; }
.log-data { border-left-color: #00BCD4; }

.log-level {
  display: inline-block;
  width: 80px;
  font-weight: bold;
  text-transform: uppercase;
}
```

## Log Levels Emoji Guide

| Level | Emoji | Description |
|-------|-------|-------------|
| `info` | ℹ️ | General information |
| `success` | ✅ | Successful operation |
| `warning` | ⚠️ | Warning or fallback used |
| `error` | ❌ | Error or failure |
| `progress` | 🔄 | Progress update |
| `data` | 📊 | Data summary or statistics |

## Custom Progress Callback

You can set a custom callback for programmatic progress tracking:

```javascript
const DataMapper = require('./services/dataMapper');

const mapper = new DataMapper();

// Set custom progress callback
mapper.setProgressCallback((progress) => {
  console.log('Custom callback:', progress);
  // Send to websocket, save to DB, etc.
});

const result = await mapper.processBusinessData(businessId);
```

## Testing

### Test API Endpoint
```bash
curl -X POST http://localhost:5000/api/data/map/your-business-id \
  -H "Authorization: Bearer your-token" \
  -H "Content-Type: application/json"
```

### Test SSE Stream
```bash
curl -N http://localhost:5000/api/data/map/your-business-id/stream \
  -H "Authorization: Bearer your-token"
```

## Benefits

✅ **Real-time Feedback**: Users see progress immediately  
✅ **Debugging**: Detailed logs help identify issues quickly  
✅ **Transparency**: Users understand what's happening at each step  
✅ **Error Tracking**: Errors include full context for troubleshooting  
✅ **Performance Monitoring**: Track timing of each operation  
✅ **Frontend Integration**: Easy to build progress UIs  

---

**Last Updated:** November 5, 2025  
**Version:** 2.1.0
