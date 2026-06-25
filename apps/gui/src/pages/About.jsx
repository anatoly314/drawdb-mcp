import { Typography } from "@douyinfe/semi-ui";
import { socials } from "../data/socials";

const { Title, Paragraph } = Typography;

export default function About() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div>
        <Title heading={2}>About</Title>
        <Paragraph>
          DrawDB-MCP is a fork of the original DrawDB project, adding AI-assistant integration via
          the Model Context Protocol (MCP).
        </Paragraph>
      </div>

      <div>
        <Title heading={4}>Credits</Title>
        <Paragraph>
          Based on{" "}
          <a className="text-blue-600" href="https://github.com/drawdb-io/drawdb">
            DrawDB
          </a>{" "}
          by the DrawDB authors.
        </Paragraph>
        <Paragraph>
          This fork lives at{" "}
          <a className="text-blue-600" href={socials.github}>
            {socials.github}
          </a>
          .
        </Paragraph>
      </div>

      <div>
        <Title heading={4}>License</Title>
        <Paragraph>
          Licensed under the{" "}
          <a className="text-blue-600" href={`${socials.github}/blob/main/LICENSE`}>
            GNU Affero General Public License v3.0 (AGPL-3.0)
          </a>
          .
        </Paragraph>
      </div>
    </div>
  );
}
