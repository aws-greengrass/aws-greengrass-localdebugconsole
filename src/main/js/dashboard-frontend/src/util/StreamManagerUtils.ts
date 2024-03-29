import model1 from "../static/streammanagerModel.json"

const model = model1.definitions;

export function formatBytes(bytes?: number | null): string {
    if (bytes === null || bytes === undefined) {
        return '-';
    } else if (bytes < 1024) {
        return bytes + ' bytes';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
}

export function getExportDefinitionType(exportDefinition: ExportDefinition): string {
    const exportTypes: string[] = [];

    if (exportDefinition.kinesis && exportDefinition.kinesis.length > 0) {
        exportTypes.push('Kinesis');
    }
    if (exportDefinition.http && exportDefinition.http.length > 0) {
        exportTypes.push('HTTP');
    }
    if (exportDefinition.iotAnalytics && exportDefinition.iotAnalytics.length > 0) {
        exportTypes.push('IoT Analytics');
    }
    if (exportDefinition.IotSitewise && exportDefinition.IotSitewise.length > 0) {
        exportTypes.push('IoT Sitewise');
    }
    if (exportDefinition.s3TaskExecutor && exportDefinition.s3TaskExecutor.length > 0) {
        exportTypes.push('S3');
    }

    return exportTypes.join(' - ');
}

export const getElapsedTime = (elapsedtimesec: number) => {
    if (elapsedtimesec > 0) {
        const elapsedSeconds = Math.floor((Date.now() - elapsedtimesec) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        const elapsedHours = Math.floor(elapsedSeconds / 60 / 60);

        if (elapsedSeconds < 1) {
            return `Just now`;
        } else if (elapsedMinutes < 1) {
            return `${elapsedSeconds} seconds ago`;
        } else if (elapsedMinutes < 60) {
            return `${elapsedMinutes} minute${elapsedMinutes !== 1 ? 's' : ''} ago`;
        } else if (elapsedHours < 24) {
            return `${elapsedHours} hour${elapsedHours !== 1 ? 's' : ''} ago`;
        } else {
            const elapsedDays = Math.floor(elapsedHours / 24);
            return `${elapsedDays} day${elapsedDays !== 1 ? 's' : ''} ago`;
        }
    } else {
        return '-'
    }
};

export const getExportType = (identifier: string, streamDetails: Stream | undefined) => {
    const exportTypes: { type: string, key: keyof ExportDefinition }[] = [
        {type: 'Kinesis', key: 'kinesis'},
        {type: 'IoT Analytics', key: 'iotAnalytics'},
        {type: 'IoT SiteWise', key: 'IotSitewise'},
        {type: 'HTTP', key: 'http'},
        {type: 'S3', key: 's3TaskExecutor'},
    ];

    if (streamDetails) {
        for (const exportType of exportTypes) {
            const exportDefinitionArray = streamDetails.messageStreamInfo.definition.exportDefinition ? streamDetails.messageStreamInfo.definition.exportDefinition[exportType.key] : Object.keys(model.ExportDefinition.properties).reduce((prev: any, id) => {
                prev[id] = [];
                return prev;
            }, {});
            if (exportDefinitionArray) {
                const match = exportDefinitionArray.find(
                    (exportDefinition: any) => exportDefinition.identifier === identifier
                );
                if (match) {
                    return exportType.type;
                }
            }
        }
    }
};


export interface IoTAnalyticsConfig {
    identifier: string,
    iotChannel: string,
    iotMsgIdPrefix: string,
    batchSize: number,
    batchIntervalMillis: number,
    priority: number,
    startSequenceNumber: number,
    disabled: boolean
}

export enum ExportFormat {
    RAW_NOT_BATCHED = 0,
    JSON_BATCHED = 1
}

export interface KinesisConfig {
    identifier: string,
    kinesisStreamName: string,
    batchSize?: number,
    batchIntervalMillis?: number,
    priority: number,
    startSequenceNumber: number,
    disabled: boolean
}


export interface HTTPConfig {
    identifier: string,
    uri: string,
    batchSize: number,
    batchIntervalMillis: number,
    priority: number,
    startSequenceNumber: number,
    disabled: boolean,
    exportFormat: ExportFormat
}

export interface IoTSiteWiseConfig {
    identifier: string,
    batchSize: number,
    batchIntervalMillis: number,
    priority: number,
    startSequenceNumber: number,
    disabled: boolean
}

export enum StatusLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3,
    TRACE = 4,
}

export const statusLevelText = {
    [StatusLevel.ERROR]: 'Error',
    [StatusLevel.WARN]: 'Warning',
    [StatusLevel.INFO]: 'Information',
    [StatusLevel.DEBUG]: 'Debug',
    [StatusLevel.TRACE]: 'Trace',
};

export interface StatusConfig {
    statusLevel: StatusLevel,
    statusStreamName: string
}

export interface S3ExportTaskExecutorConfig {
    identifier: string,
    sizeThresholdForMultipartUploadBytes: number,
    priority: number,
    disabled: boolean,
    statusConfig: StatusConfig
}

export enum Persistence {
    File,
    Memory
}

export enum StrategyOnFull {
    RejectNewData = 0,
    OverwriteOldestData = 1
}

export interface ExportDefinition {
    kinesis: KinesisConfig[];
    http: HTTPConfig[];
    iotAnalytics: IoTAnalyticsConfig[];
    IotSitewise: IoTSiteWiseConfig[];
    s3TaskExecutor: S3ExportTaskExecutorConfig[];
}

interface StorageStatus {
    newestSequenceNumber: number;
    oldestSequenceNumber: number;
    totalBytes: number;
}

export interface ExportStatus {
    errorMessage: string;
    exportConfigIdentifier: string;
    exportedBytesFromStream: number;
    exportedMessagesCount: number;
    lastExportTime: number;
    lastExportedSequenceNumber: number;
}

export interface MessageStreamInfo {
    definition: MessageStreamDefinition;
    storageStatus: StorageStatus;
    exportStatuses: ExportStatus[];
}

export interface Stream {
    key: number;
    messageStreamInfo: MessageStreamInfo;
}

export interface StreamManagerComponentConfiguration {
    Version: string;
    JVM_ARGS: string;
    LOG_LEVEL: string;
    STREAM_MANAGER_AUTHENTICATE_CLIENT: string;
    STREAM_MANAGER_EXPORTER_MAX_BANDWIDTH: string;
    STREAM_MANAGER_EXPORTER_THREAD_POOL_SIZE: string;
    STREAM_MANAGER_EXPORTER_S3_DESTINATION_MULTIPART_UPLOAD_MIN_PART_SIZE_BYTES: string;
    STREAM_MANAGER_SERVER_PORT: string;
    STREAM_MANAGER_STORE_ROOT_DIR: string;
}

export interface Message {
    streamName: string;
    sequenceNumber?: number | null; // Use number or null to represent Long or optional
    ingestTime?: number | null; // Use number or null to represent Long or optional
    payload: Uint8Array | null; // Use Uint8Array or null to represent byte[] or optional
}

export interface MessageStreamDefinition {
    name: string,
    maxSize: number,
    streamSegmentSize: number,
    timeToLiveMillis?: number,
    strategyOnFull: StrategyOnFull,
    persistence: Persistence,
    flushOnWrite: boolean,
    exportDefinition: ExportDefinition,
}

export function StreamManagerReducer(state: any, action: any) {
    switch (action.type) {
        case "set_name":
            const alphanumericRegex = new RegExp(model.MessageStreamDefinition.properties.name.pattern);
            if (action.payload.length === 0) {
                action.callbackError('Name cannot be empty.');
            } else if (action.payload.length < model.MessageStreamDefinition.properties.name.minLength || action.payload.length > model.MessageStreamDefinition.properties.name.maxLength) {
                action.callbackError(`Name length must be between ${model.MessageStreamDefinition.properties.name.minLength} and ${model.MessageStreamDefinition.properties.name.maxLength} characters.`);
            } else if (!alphanumericRegex.test(action.payload)) {
                action.callbackError('Name must be alphanumeric and can include spaces, commas, periods, hyphens, and underscores.');
            } else {
                action.callbackError('');
            }
            return {
                ...state,
                name: action.payload
            };
        case "set_maxSize":
            if (parseInt(action.payload, 10) < model.MessageStreamDefinition.properties.maxSize.minimum) {
                action.callbackError(`Max size cannot be lower than ${model.MessageStreamDefinition.properties.maxSize.minimum} bytes.`);
            } else {
                action.callbackError('');
            }
            return {
                ...state,
                maxSize: parseInt(action.payload, 10)
            };
        case "set_streamSegmentSize":
            if (parseInt(action.payload, 10) < model.MessageStreamDefinition.properties.streamSegmentSize.minimum) {
                action.callbackError(`stream segment size cannot be lower than ${model.MessageStreamDefinition.properties.streamSegmentSize.minimum} bytes.`);
            } else {
                action.callbackError('');
            }
            return {
                ...state,
                streamSegmentSize: parseInt(action.payload, 10)
            };
        case "set_streamTtl":
            if (action.payload === null || action.payload.length === 0) {
                action.callbackError('');
                return {
                    ...state,
                    timeToLiveMillis: undefined
                };
            }
            if (parseInt(action.payload, 10) < model.MessageStreamDefinition.properties.timeToLiveMillis.minimum) {
                action.callbackError(`stream ttl cannot be lower than ${model.MessageStreamDefinition.properties.timeToLiveMillis.minimum} ms.`);
            } else {
                action.callbackError('');
            }
            return {
                ...state,
                timeToLiveMillis: parseInt(action.payload, 10)
            };
        case "set_strategyOnFull":
            return {
                ...state,
                strategyOnFull: parseInt(action.payload, 10)
            };
        case "set_persistence":
            return {
                ...state,
                persistence: parseInt(action.payload, 10)
            };
        case "set_flushOnWrite":
            return {
                ...state,
                flushOnWrite: parseInt(action.payload) === 0
            };
        case "clear":
            action.callbackError('');
            return {
                name: "new-stream",
                maxSize: model.MessageStreamDefinition.properties.maxSize.default,
                streamSegmentSize: model.MessageStreamDefinition.properties.streamSegmentSize.default,
                strategyOnFull: StrategyOnFull.OverwriteOldestData,
                persistence: Persistence.File,
                flushOnWrite: false,
                exportDefinition: Object.keys(model.ExportDefinition.properties).reduce((prev: any, id) => {
                    prev[id] = [];
                    return prev;
                }, {})
            };

        case "set_all":
            return {
                name: action.payload.name,
                maxSize: action.payload.maxSize,
                streamSegmentSize: action.payload.streamSegmentSize,
                timeToLiveMillis: action.payload.timeToLiveMillis,
                strategyOnFull: action.payload.strategyOnFull,
                persistence: action.payload.persistence,
                flushOnWrite: action.payload.flushOnWrite,
                exportDefinition: action.payload.exportDefinition
            };
    }
}

export function generateRandom4DigitNumber(): number {
    const min = 1000; // Minimum 4-digit number
    const max = 9999; // Maximum 4-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
