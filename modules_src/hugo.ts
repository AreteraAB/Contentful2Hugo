import * as contentaggregator from "contentaggregator";

export async function formatEntry(resultStream: contentaggregator.IBinaryResultStream, data: any, context: contentaggregator.INodeContext)
{
    try {
        var key = data.key;
        var entry = await contentaggregator.load(context, "content", "entries", "", key);
        await contentaggregator.setValue(context, "metadata:filename", entry.sys.id + ".md");

        resultStream.stream.write(JSON.stringify(entry, null, "\t"));
        resultStream.stream.write("\n");

        const contentType = entry.sys.contentType.sys.id;
        if (formatters[contentType]) {
            await formatters[contentType](entry, resultStream.stream, context);
        } else {
            await formatters["default"](entry, resultStream.stream, context);
        }
    } finally {
        resultStream.stream.end();
    }
};


/**
 * ** Markdown formatters **
 */

async function formatImage(context: contentaggregator.INodeContext, field, locale) {
    var key = field.sys.id + "_" + locale;
    var asset = await contentaggregator.load(context, "content", "assets", "", key);

    return `![${asset.fields.description}](/images/${asset.fields.file.fileName})\n`;
}

var formatters = {
    "default"(data, stream, context) {
        stream.write(`# ${data.sys.id} #\n`);
        stream.write(`This content is of type \`${data.sys.contentType.sys.id}\`\n`);

        for (let property in data.fields) {
            if (data.fields.hasOwnProperty(property)) {
                stream.write(`* data.fields.${property} = ${data.fields[property]}\n`);
            }
        }
    },

    "cat"(data, stream) {
        stream.write(`# ${data.fields.name} #\n`);
        stream.write(`This is a cat named ${data.fields.name}.\n` );
    },
    "startPage"(data, stream) {
        stream.write(`# ${data.fields.headline} #\n`);
        stream.write(`${data.fields.preamble}\n` );
    },
    "article"(data, stream) {
        stream.write(`# ${data.fields.headline} #\n`);
        stream.write(`${data.fields.preamble}\n` );
    },
    "section": async function (data, stream, context) {
        stream.write(`# ${data.fields.headline} #\n`);
        stream.write(await formatImage(context, data.fields.imageUrl, data.locale));
        stream.write(`_${data.fields.preamble}_\n`);
        stream.write("\n");
        stream.write(`${data.fields.mainBody}\n` );
    }
}