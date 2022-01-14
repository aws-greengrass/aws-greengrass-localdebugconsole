package com.aws.greengrass.localdebugconsole.messageutils;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;

@AllArgsConstructor
@EqualsAndHashCode
@Getter
public class LogItem {
    private String name;
    private String log;
}
