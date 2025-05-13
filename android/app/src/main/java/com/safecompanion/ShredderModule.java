package com.safecompanion;

import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Map;

public class ShredderModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "Shredder";
    private final SecureRandom secureRandom;

    public ShredderModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.secureRandom = new SecureRandom();
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void isAvailable(Promise promise) {
        promise.resolve(true);
    }

    @ReactMethod
    public void securelyDeleteFile(String filePath, int passes, Promise promise) {
        try {
            File file = new File(filePath);
            
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "The specified file does not exist");
                return;
            }
            
            if (!file.canWrite()) {
                promise.reject("FILE_NOT_WRITABLE", "The specified file cannot be written to");
                return;
            }
            
            long length = file.length();
            secureDelete(file, passes);
            boolean deleted = file.delete();
            
            if (deleted) {
                promise.resolve("File securely deleted");
            } else {
                promise.reject("DELETE_FAILED", "Failed to delete the file after shredding");
            }
        } catch (Exception e) {
            promise.reject("SHRED_ERROR", "Error during secure deletion: " + e.getMessage(), e);
        }
    }
    
    private void secureDelete(File file, int passes) throws IOException {
        if (passes < 1) passes = 1;
        
        long length = file.length();
        RandomAccessFile raf = new RandomAccessFile(file, "rws");
        
        try {
            for (int i = 0; i < passes; i++) {
                raf.seek(0);
                byte[] randomData = new byte[4096];
                
                for (long pos = 0; pos < length; pos += randomData.length) {
                    secureRandom.nextBytes(randomData);
                    int writeLength = (int) Math.min(randomData.length, length - pos);
                    raf.write(randomData, 0, writeLength);
                }
                
                raf.getFD().sync();
            }
            
            raf.seek(0);
            byte[] zeros = new byte[4096];
            for (long pos = 0; pos < length; pos += zeros.length) {
                int writeLength = (int) Math.min(zeros.length, length - pos);
                raf.write(zeros, 0, writeLength);
            }
            
            raf.setLength(0);
            raf.getFD().sync();
        } finally {
            raf.close();
        }
    }
}
