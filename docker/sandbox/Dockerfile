FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install base dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nodejs \
    npm \
    curl \
    wget \
    git \
    zip \
    unzip \
    jq \
    vim \
    nano \
    sudo \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Install headless Chrome for web browsing
RUN curl -LO https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
    && apt-get update \
    && apt-get install -y ./google-chrome-stable_current_amd64.deb \
    && rm google-chrome-stable_current_amd64.deb \
    && rm -rf /var/lib/apt/lists/*

# Install Python packages
RUN pip3 install --no-cache-dir \
    pandas \
    numpy \
    matplotlib \
    seaborn \
    scikit-learn \
    beautifulsoup4 \
    requests \
    jupyter \
    notebook \
    pytest

# Install Node.js packages
RUN npm install -g \
    typescript \
    ts-node \
    axios \
    puppeteer \
    cheerio \
    csv-parser \
    playwright

# Setup sandbox user with limited privileges
RUN useradd -m -s /bin/bash -u 1000 sandbox \
    && echo "sandbox ALL=(ALL) NOPASSWD: /usr/bin/apt-get, /usr/bin/pip3" > /etc/sudoers.d/sandbox

# Setup sandbox directory
RUN mkdir -p /manus-sandbox \
    && chown -R sandbox:sandbox /manus-sandbox \
    && chmod 755 /manus-sandbox

# Create subdirectories
RUN mkdir -p /manus-sandbox/code \
    /manus-sandbox/files \
    /manus-sandbox/downloads \
    /manus-sandbox/libs/python \
    /manus-sandbox/libs/node \
    && chown -R sandbox:sandbox /manus-sandbox \
    && chmod -R 755 /manus-sandbox

# Expose necessary ports
EXPOSE 3001 3002 8888

# Switch to non-root sandbox user
USER sandbox
WORKDIR /manus-sandbox

# Entry point
CMD ["bash", "-c", "tail -f /dev/null"]