import * as foopipes from "foopipes";

export async function formatEntry(data: any, context: foopipes.ICallContext) : Promise<foopipes.IResult>
{
    const r = new foopipes.ProcessStreamResult(context);

    var key = data.key;
    var entry = await foopipes.load(context, "content", "entries", "", key);
    await foopipes.setValue(context, "metadata:filename", entry.sys.id + ".md");

    r.stream.write(JSON.stringify(entry, null, "\t"));
    r.stream.write("\n");

    const contentType = entry.sys.contentType.sys.id;
    if (formatters[contentType]) {
        await formatters[contentType](entry, r.stream, context);
    } else {
        await formatters["default"](entry, r.stream, context);
    }
    return r;
};


/**
 * ** Markdown formatters **
 */

async function formatImage(context: foopipes.ICallContext, field, locale) {
    var key = field.sys.id + "_" + locale;
    var asset = await foopipes.load(context, "content", "assets", "", key);

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
    "section": async function (data, stream, context) : Promise<void> {
        stream.write(`# ${data.fields.headline} #\n`);
        stream.write(await formatImage(context, data.fields.imageUrl, data.locale));
        stream.write(`_${data.fields.preamble}_\n`);
        stream.write("\n");
        stream.write(`${data.fields.mainBody}\n` );
    }
}