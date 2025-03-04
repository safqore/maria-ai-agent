# MariaAiAgent Crew

Welcome to the MariaAiAgent Crew project, powered by [crewAI](https://crewai.com). This template is designed to help you set up a multi-agent AI system with ease, leveraging the powerful and flexible framework provided by crewAI. Our goal is to enable your agents to collaborate effectively on complex tasks, maximizing their collective intelligence and capabilities.

## Install NPM 
```bash
sudo apt install nodejs npm
```

## Verify Node.js and NPM Installation
```bash
node -v
npm -v
```

## Install NPM Libraries
```bash
cd ~/frontend/client
npm install xstate dropzone lodash

cd ~/frontend/client
npm install xstate @xstate/react
```

## Run React Application
```bash
npm start
```

## Virtual Environment Setup

Create a virtual environment running Python version 3.12

```bash
conda create -n maria-ai-agent python=3.12
```

Activate virtual environment and Install CrewAI core package and additional tools

```bash
conda activate maria-ai-agent
pip install crewai crewai-tools
```

## Installation

Ensure you have Python >=3.10 <3.13 installed on your system. This project uses [UV](https://docs.astral.sh/uv/) for dependency management and package handling, offering a seamless setup and execution experience.

First, if you haven't already, install uv:

```bash
pip install uv
```

Next, navigate to your project directory and install the dependencies:

(Optional) Lock the dependencies and install them by using the CLI command:
```bash
crewai install
```

### Customizing

**Add your `OPENAI_API_KEY` into the `.env` file**

Create .env file in root of your project directory with the following content:

```bash
MODEL=gpt-4o-mini
OPENAI_API_KEY=<REPLACE WITH API KEY>
```

- Modify `src/maria_ai_agent/config/agents.yaml` to define your agents
- Modify `src/maria_ai_agent/config/tasks.yaml` to define your tasks
- Modify `src/maria_ai_agent/crew.py` to add your own logic, tools and specific args
- Modify `src/maria_ai_agent/main.py` to add custom inputs for your agents and tasks

## Running the Project

To kickstart your crew of AI agents and begin task execution, run this from the root folder of your project:

```bash
$ crewai run
```

This command initializes the maria-ai-agent Crew, assembling the agents and assigning them tasks as defined in your configuration.

This example, unmodified, will run the create a `report.md` file with the output of a research on LLMs in the root folder.

## Understanding Your Crew

The maria-ai-agent Crew is composed of multiple AI agents, each with unique roles, goals, and tools. These agents collaborate on a series of tasks, defined in `config/tasks.yaml`, leveraging their collective skills to achieve complex objectives. The `config/agents.yaml` file outlines the capabilities and configurations of each agent in your crew.

## Support

For support, questions, or feedback regarding the MariaAiAgent Crew or crewAI.
- Visit our [documentation](https://docs.crewai.com)
- Reach out to us through our [GitHub repository](https://github.com/joaomdmoura/crewai)
- [Join our Discord](https://discord.com/invite/X4JWnZnxPb)
- [Chat with our docs](https://chatg.pt/DWjSBZn)

Let's create wonders together with the power and simplicity of crewAI.
